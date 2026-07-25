import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withParticipant } from '@/lib/middleware';
import { Stream, StreamEnrollment } from '@db/models';
import { Conflict, BadRequest, NotFound } from '@/lib/errors';
import type { AuthenticatedRequest } from '@/types/auth';

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as AuthenticatedRequest).user;
  const { id } = req.query;

  const stream = await Stream.findByPk(id as string);
  if (!stream) {
    throw new NotFound('Stream not found');
  }

  if (stream.status === 'finished') {
    throw new BadRequest('Cannot enroll in a finished stream');
  }

  const existing = await StreamEnrollment.findOne({
    where: { streamId: stream.id, participantId: user.userId },
  });
  if (existing) {
    throw new Conflict('You are already enrolled in this stream');
  }

  const enrollment = await StreamEnrollment.create({
    streamId: stream.id,
    participantId: user.userId,
  });

  return success(res, {
    id: enrollment.id,
    streamId: enrollment.streamId,
    participantId: enrollment.participantId,
    enrolledAt: enrollment.enrolledAt,
  }, 201);
}

export default apiHandler({
  POST: withParticipant(postHandler),
});
