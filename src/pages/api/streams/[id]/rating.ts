import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withParticipant } from '@/lib/middleware';
import { NotFound, Forbidden } from '@/lib/errors';
import { Stream, StreamEnrollment, StreamRating, User } from '@db/models';
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

  const ratings = await StreamRating.findAll({
    where: { streamId },
    order: [['rank', 'ASC']],
  });

  const participantIds = ratings.map((r) => r.participantId);
  const participants = participantIds.length
    ? await User.findAll({
        where: { id: participantIds },
        attributes: ['id', 'name'],
      })
    : [];
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  const table = ratings.map((rating) => {
    const participant = participantMap.get(rating.participantId);
    return {
      rank: rating.rank,
      participantId: rating.participantId,
      participantName: participant?.name ?? 'Unknown',
      filledDays: rating.filledDays,
      entryWeight: rating.entryWeight !== null ? Number(rating.entryWeight) : null,
      currentWeight:
        rating.currentWeight !== null ? Number(rating.currentWeight) : null,
      weightLossPercent: Number(rating.weightLossPercent),
      calculatedAt: rating.calculatedAt,
    };
  });

  return success(res, { streamId, ratings: table });
}

export default apiHandler({
  GET: withParticipant(getHandler),
});
