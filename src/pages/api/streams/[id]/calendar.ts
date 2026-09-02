import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withParticipant } from '@/lib/middleware';
import { Forbidden, NotFound } from '@/lib/errors';
import { getCurrentDayNumber } from '@/lib/calendar';
import { ensureStreamStatus } from '@/lib/streamStatus';
import {
  Stream,
  MarathonTemplate,
  StreamEnrollment,
  DailyReport,
  StreamRating,
  User,
} from '@db/models';
import type { AuthenticatedRequest } from '@/types/auth';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;

  const rawId = req.query.id;
  const streamId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!streamId) {
    throw new NotFound('Stream not found');
  }

  const [currentUser, stream, enrollment] = await Promise.all([
    User.findByPk(user.userId, { attributes: ['id', 'timezone'] }),
    Stream.findByPk(streamId),
    StreamEnrollment.findOne({
      where: { streamId, participantId: user.userId },
    }),
  ]);

  if (!currentUser) {
    throw new NotFound('User not found');
  }
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

  stream.status = (await ensureStreamStatus(stream.id)) || stream.status;

  const currentDayNumber = getCurrentDayNumber(
    stream.startDate,
    currentUser.timezone,
    template.durationDays
  );

  const reports = await DailyReport.findAll({
    where: { enrollmentId: enrollment.id },
    attributes: ['id', 'dayNumber', 'totalCalories', 'filledAt'],
    order: [['dayNumber', 'ASC']],
  });

  const [myRating, totalParticipants] = await Promise.all([
    StreamRating.findOne({
      where: { streamId: stream.id, participantId: user.userId },
    }),
    StreamRating.count({ where: { streamId: stream.id } }),
  ]);

  return success(res, {
    stream: {
      id: stream.id,
      startDate: stream.startDate,
      status: stream.status,
      template: {
        id: template.id,
        title: template.title,
        description: template.description,
        durationDays: template.durationDays,
      },
    },
    currentDayNumber,
    targetCalories: enrollment.targetCalories ?? null,
    goal: enrollment.goal ?? null,
    rating: {
      rank: myRating?.rank ?? null,
      totalParticipants,
      weightLossPercent: myRating ? Number(myRating.weightLossPercent) : 0,
    },
    reports: reports.map((report) => ({
      id: report.id,
      dayNumber: report.dayNumber,
      totalCalories: Number(report.totalCalories),
      filledAt: report.filledAt,
    })),
  });
}

export default apiHandler({
  GET: withParticipant(getHandler),
});
