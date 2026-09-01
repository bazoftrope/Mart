import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withParticipant } from '@/lib/middleware';
import { Stream, StreamEnrollment, User } from '@db/models';
import { Conflict, BadRequest, NotFound } from '@/lib/errors';
import { enrollSchema } from '@/lib/validate';
import { calculateTargetCalories, isProfileComplete } from '@/lib/calorieCalculator';
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

  const body = enrollSchema.parse(req.body ?? {});
  const dbUser = await User.findByPk(user.userId, {
    attributes: ['id', 'sex', 'heightCm', 'weightKg', 'age'],
  });
  if (!dbUser) {
    throw new NotFound('User not found');
  }

  const profile = {
    sex: dbUser.sex,
    heightCm: dbUser.heightCm,
    weightKg: dbUser.weightKg === null || dbUser.weightKg === undefined
      ? null
      : Number(dbUser.weightKg),
    age: dbUser.age,
  };

  if (!isProfileComplete(profile)) {
    throw new BadRequest(
      'Сначала заполните анкету профиля: пол, рост, вес и возраст'
    );
  }

  const targetCalories = calculateTargetCalories(
    {
      sex: profile.sex as 'male' | 'female',
      heightCm: profile.heightCm as number,
      weightKg: profile.weightKg as number,
      age: profile.age as number,
    },
    body.goal
  );

  const enrollment = await StreamEnrollment.create({
    streamId: stream.id,
    participantId: user.userId,
    goal: body.goal,
    targetCalories,
  });

  return success(res, {
    id: enrollment.id,
    streamId: enrollment.streamId,
    participantId: enrollment.participantId,
    goal: enrollment.goal,
    targetCalories: enrollment.targetCalories,
    enrolledAt: enrollment.enrolledAt,
  }, 201);
}

export default apiHandler({
  POST: withParticipant(postHandler),
});
