import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { addDays, format, parseISO } from 'date-fns';
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

  // Participant's daily calories and weights
  const myReports = await DailyReport.findAll({
    where: { enrollmentId: enrollment.id },
    attributes: ['dayNumber', 'totalCalories', 'weightKg'],
    order: [['dayNumber', 'ASC']],
  });

  const dailyCalories = myReports.map((r) => ({
    day: r.dayNumber,
    calories: Number(r.totalCalories),
  }));

  const dailyWeights = myReports
    .filter((r) => r.weightKg !== null && r.weightKg !== undefined && Number(r.weightKg) > 0)
    .map((r) => ({
      day: r.dayNumber,
      weightKg: Number(r.weightKg),
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
  let streamAvgCalories = 0;
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

    const overallAvg = await DailyReport.findOne({
      where: { enrollmentId: enrollmentIds },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('total_calories')), 'avgCalories'],
      ],
      raw: true,
    });
    const overallRow = overallAvg as unknown as { avgCalories?: string | number };
    streamAvgCalories =
      overallRow?.avgCalories != null ? Number(Number(overallRow.avgCalories).toFixed(1)) : 0;

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

  const durationDays = template.durationDays;
  const totalDays = durationDays || 0;
  const endDate = addDays(parseISO(stream.startDate), Math.max(totalDays - 1, 0));

  return success(res, {
    stream: {
      title: template.title,
      startDate: stream.startDate,
      endDate: format(endDate, 'yyyy-MM-dd'),
      durationDays: totalDays,
    },
    participant: {
      dailyCalories,
      dailyWeights,
      avgCalories,
      totalDays: dailyCalories.length,
    },
    streamAverage,
    summary: {
      rank: rating?.rank ?? null,
      weightLossPercent: rating ? Number(rating.weightLossPercent) : 0,
      entryWeight: rating?.entryWeight !== null ? Number(rating?.entryWeight) : null,
      currentWeight:
        rating?.currentWeight !== null ? Number(rating?.currentWeight) : null,
      filledDays: rating?.filledDays ?? 0,
      disciplinePercent:
        totalDays > 0
          ? Number((((rating?.filledDays ?? 0) / totalDays) * 100).toFixed(1))
          : 0,
      avgCalories,
      streamAvgCalories,
      totalParticipants,
    },
  });
}

export default apiHandler({
  GET: withParticipant(getHandler),
});
