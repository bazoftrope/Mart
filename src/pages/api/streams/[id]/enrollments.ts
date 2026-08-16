import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withMentor } from '@/lib/middleware';
import { Stream, MarathonTemplate, StreamEnrollment, StreamRating, User } from '@db/models';
import { Forbidden, NotFound } from '@/lib/errors';
import type { AuthenticatedRequest } from '@/types/auth';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as AuthenticatedRequest).user;
  const { id } = req.query;

  const stream = await Stream.findByPk(id as string);
  if (!stream) {
    throw new NotFound('Stream not found');
  }

  const template = await MarathonTemplate.findByPk(stream.templateId);
  if (!template || template.mentorId !== user.userId) {
    throw new Forbidden('You can only view enrollments for your own streams');
  }

  const enrollments = await StreamEnrollment.findAll({
    where: { streamId: stream.id },
    order: [['enrolled_at', 'DESC']],
  });

  const participantIds = enrollments.map((e) => e.participantId);
  const [participants, ratings] = await Promise.all([
    participantIds.length
      ? User.findAll({ where: { id: participantIds }, attributes: ['id', 'name', 'email'] })
      : [],
    participantIds.length
      ? StreamRating.findAll({
          where: { streamId: stream.id, participantId: participantIds },
        })
      : [],
  ]);
  const participantMap = new Map(participants.map((p) => [p.id, p]));
  const ratingMap = new Map(ratings.map((r) => [r.participantId, r]));

  const data = enrollments.map((enrollment) => {
    const participant = participantMap.get(enrollment.participantId);
    const rating = ratingMap.get(enrollment.participantId);
    return {
      id: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      participant: participant
        ? { id: participant.id, name: participant.name, email: participant.email }
        : null,
      rating: rating
        ? {
            rank: rating.rank ?? null,
            weightLossPercent: Number(rating.weightLossPercent),
            entryWeight:
              rating.entryWeight !== null ? Number(rating.entryWeight) : null,
            currentWeight:
              rating.currentWeight !== null ? Number(rating.currentWeight) : null,
          }
        : null,
    };
  });

  data.sort((a, b) => {
    const percentA = a.rating?.weightLossPercent ?? 0;
    const percentB = b.rating?.weightLossPercent ?? 0;
    return percentB - percentA;
  });

  return success(res, data);
}

export default apiHandler({
  GET: withMentor(getHandler),
});
