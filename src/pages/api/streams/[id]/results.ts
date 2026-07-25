import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withParticipant } from '@/lib/middleware';
import { NotFound, Forbidden } from '@/lib/errors';
import { sequelize } from '@db/db';
import {
  Stream,
  MarathonTemplate,
  StreamEnrollment,
  DailyReport,
  StreamRating,
} from '@db/models';
import type { AuthenticatedRequest } from '@/types/auth';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;

  const rawId = req.query.id;
  const streamId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!streamId) {
    throw new NotFound('Stream not found');
  }

  const [stream, enrollment] = await Promise.all([
    Stream.findByPk(streamId),
    StreamEnrollment.findOne({
      where: { streamId, participantId: user.userId },
    }),
  ]);

  if (!stream) {
    throw new NotFound('Stream not found');
  }
  if (!enrollment) {
    throw new Forbidden('You are not enrolled in this stream');
  }

  const template = await MarathonTemplate.findByPk(stream.templateId);
  if (!template) {
    throw new NotFound('Template not found');
  }

  // Participant's daily calories
  const myReports = await DailyReport.findAll({
    where: { enrollmentId: enrollment.id },
    attributes: ['dayNumber', 'totalCalories'],
    order: [['dayNumber', 'ASC']],
  });

  const dailyCalories = myReports.map((r) => ({
    day: r.dayNumber,
    calories: Number(r.totalCalories),
  }));

  const avgCalories =
    dailyCalories.length > 0
      ? Number(
          (
            dailyCalories.reduce((sum, d) => sum + d.calories, 0) /
            dailyCalories.length
          ).toFixed(1)
        )
      : 0;

  // Stream-wide average per day
  const enrollments = await StreamEnrollment.findAll({
    where: { streamId },
    attributes: ['id'],
  });
  const enrollmentIds = enrollments.map((e) => e.id);

  const streamAverage: Array<{ day: number; avgCalories: number }> = [];
  if (enrollmentIds.length > 0) {
    const allReports = await DailyReport.findAll({
      where: { enrollmentId: enrollmentIds },
      attributes: [
        'dayNumber',
        [sequelize.fn('AVG', sequelize.col('total_calories')), 'avgCalories'],
      ],
      group: ['dayNumber'],
      order: [['dayNumber', 'ASC']],
      raw: true,
    });

    for (const r of allReports) {
      const row = r as unknown as { dayNumber: number; avgCalories: string | number };
      streamAverage.push({
        day: row.dayNumber,
        avgCalories: Number(Number(row.avgCalories).toFixed(1)),
      });
    }
  }

  // Summary from StreamRating
  const rating = await StreamRating.findOne({
    where: { streamId, participantId: user.userId },
  });

  const totalParticipants = await StreamRating.count({
    where: { streamId },
  });

  return success(res, {
    participant: {
      dailyCalories,
      avgCalories,
      totalDays: dailyCalories.length,
    },
    streamAverage,
    summary: {
      rank: rating?.rank ?? null,
      disciplinePercent: rating ? Number(rating.disciplinePercent) : 0,
      filledDays: rating?.filledDays ?? 0,
      avgCalories,
      totalParticipants,
    },
  });
}

export default apiHandler({
  GET: withParticipant(getHandler),
});
