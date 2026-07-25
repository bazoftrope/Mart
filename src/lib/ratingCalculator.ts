import 'reflect-metadata';
import { Op } from 'sequelize';
import { sequelize } from '@db/db';
import {
  Stream,
  StreamEnrollment,
  DailyReport,
  StreamRating,
  MarathonTemplate,
} from '@db/models';
import type { StreamStatus } from '@db/models/Stream';

type EnrollmentStats = {
  enrollment: StreamEnrollment;
  filledDays: number;
};

export async function calculateRatingsForStream(streamId: string): Promise<void> {
  const stream = await Stream.findByPk(streamId);
  if (!stream) {
    throw new Error(`Stream ${streamId} not found`);
  }
  if (stream.status !== 'running' && stream.status !== 'finished') {
    throw new Error(`Stream ${streamId} is not running or finished`);
  }

  const template = await MarathonTemplate.findByPk(stream.templateId);
  if (!template) {
    throw new Error(`Template for stream ${streamId} not found`);
  }

  const durationDays = template.durationDays;
  if (!durationDays || durationDays <= 0) {
    throw new Error(`Invalid durationDays for stream ${streamId}`);
  }

  const enrollments = await StreamEnrollment.findAll({
    where: { streamId: stream.id },
  });

  const calculatedAt = new Date();
  const stats: EnrollmentStats[] = [];

  for (const enrollment of enrollments) {
    const [result] = await DailyReport.findAll({
      where: { enrollmentId: enrollment.id },
      attributes: [
        [
          sequelize.fn(
            'COUNT',
            sequelize.fn('DISTINCT', sequelize.col('day_number'))
          ),
          'filledDays',
        ],
      ],
      raw: true,
    });

    const filledDays = Number(
      (result as unknown as { filledDays: string | number }).filledDays
    );
    stats.push({ enrollment, filledDays });
  }

  stats.sort((a, b) => {
    const percentA = (a.filledDays / durationDays) * 100;
    const percentB = (b.filledDays / durationDays) * 100;

    if (percentB !== percentA) {
      return percentB - percentA;
    }
    if (b.filledDays !== a.filledDays) {
      return b.filledDays - a.filledDays;
    }
    return (
      a.enrollment.enrolledAt.getTime() - b.enrollment.enrolledAt.getTime()
    );
  });

  const transaction = await sequelize.transaction();
  try {
    if (enrollments.length === 0) {
      await StreamRating.destroy({
        where: { streamId: stream.id },
        transaction,
      });
    } else {
      const participantIds = enrollments.map((e) => e.participantId);

      for (let index = 0; index < stats.length; index++) {
        const { enrollment, filledDays } = stats[index];
        const rank = index + 1;
        const disciplinePercent = Number(
          ((filledDays / durationDays) * 100).toFixed(2)
        );

        const existing = await StreamRating.findOne({
          where: {
            streamId: stream.id,
            participantId: enrollment.participantId,
          },
          transaction,
        });

        if (existing) {
          existing.filledDays = filledDays;
          existing.disciplinePercent = disciplinePercent;
          existing.rank = rank;
          existing.calculatedAt = calculatedAt;
          await existing.save({ transaction });
        } else {
          await StreamRating.create(
            {
              streamId: stream.id,
              participantId: enrollment.participantId,
              filledDays,
              disciplinePercent,
              rank,
              calculatedAt,
            },
            { transaction }
          );
        }
      }

      await StreamRating.destroy({
        where: {
          streamId: stream.id,
          participantId: { [Op.notIn]: participantIds },
        },
        transaction,
      });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function calculateAllRatings(): Promise<{
  processed: number;
  errors: Array<{ streamId: string; message: string }>;
}> {
  const streams = await Stream.findAll({
    where: {
      status: { [Op.in]: ['running', 'finished'] as StreamStatus[] },
    },
  });

  const errors: Array<{ streamId: string; message: string }> = [];
  let processed = 0;

  for (const stream of streams) {
    try {
      await calculateRatingsForStream(stream.id);
      processed++;
    } catch (error) {
      errors.push({
        streamId: stream.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { processed, errors };
}
