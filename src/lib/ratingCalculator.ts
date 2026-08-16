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
  entryWeight: number | null;
  currentWeight: number | null;
  weightLossPercent: number;
};

export async function calculateRatingsForStream(streamId: string): Promise<void> {
  const stream = await Stream.findByPk(streamId);
  if (!stream) {
    throw new Error(`Stream ${streamId} not found`);
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
    const reports = await DailyReport.findAll({
      where: { enrollmentId: enrollment.id },
      attributes: ['dayNumber', 'weightKg'],
      order: [['dayNumber', 'ASC']],
      raw: true,
    });

    const filledDays = reports.length;
    const weightReports = reports.filter(
      (r) => r.weightKg !== null && r.weightKg !== undefined && Number(r.weightKg) > 0
    );
    const entryWeight = weightReports.length
      ? Number(weightReports[0].weightKg)
      : null;
    const currentWeight = weightReports.length
      ? Number(weightReports[weightReports.length - 1].weightKg)
      : null;

    let weightLossPercent = 0;
    if (entryWeight && entryWeight > 0 && currentWeight !== null) {
      weightLossPercent = Number(
        (((entryWeight - currentWeight) / entryWeight) * 100).toFixed(2)
      );
    }

    stats.push({ enrollment, filledDays, entryWeight, currentWeight, weightLossPercent });
  }

  stats.sort((a, b) => b.weightLossPercent - a.weightLossPercent);

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
        const { enrollment, filledDays, entryWeight, currentWeight, weightLossPercent } =
          stats[index];
        const rank = index + 1;

        const existing = await StreamRating.findOne({
          where: {
            streamId: stream.id,
            participantId: enrollment.participantId,
          },
          transaction,
        });

        if (existing) {
          existing.filledDays = filledDays;
          existing.entryWeight = entryWeight;
          existing.currentWeight = currentWeight;
          existing.weightLossPercent = weightLossPercent;
          existing.rank = rank;
          existing.calculatedAt = calculatedAt;
          await existing.save({ transaction });
        } else {
          await StreamRating.create(
            {
              streamId: stream.id,
              participantId: enrollment.participantId,
              filledDays,
              entryWeight,
              currentWeight,
              weightLossPercent,
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
