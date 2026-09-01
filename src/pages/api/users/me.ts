import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withAuth } from '@/lib/middleware';
import { NotFound } from '@/lib/errors';
import { User } from '@db/models';
import { toPublicUser } from '@/lib/auth';
import { profileSchema } from '@/lib/validate';
import { isProfileComplete } from '@/lib/calorieCalculator';
import type { AuthenticatedRequest } from '@/types/auth';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;

  const dbUser = await User.findByPk(user.userId);
  if (!dbUser) {
    throw new NotFound('User not found');
  }

  const publicUser = toPublicUser(dbUser);

  return success(res, {
    user: publicUser,
    profileCompleted: isProfileComplete({
      sex: publicUser.sex,
      heightCm: publicUser.heightCm,
      weightKg: publicUser.weightKg,
      age: publicUser.age,
    }),
  });
}

async function patchHandler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;
  const body = profileSchema.parse(req.body);

  const dbUser = await User.findByPk(user.userId);
  if (!dbUser) {
    throw new NotFound('User not found');
  }

  dbUser.sex = body.sex;
  dbUser.heightCm = body.heightCm;
  dbUser.weightKg = body.weightKg;
  dbUser.age = body.age;
  await dbUser.save();

  const publicUser = toPublicUser(dbUser);

  return success(res, {
    user: publicUser,
    profileCompleted: isProfileComplete({
      sex: publicUser.sex,
      heightCm: publicUser.heightCm,
      weightKg: publicUser.weightKg,
      age: publicUser.age,
    }),
  });
}

export default apiHandler({
  GET: withAuth(getHandler),
  PATCH: withAuth(patchHandler),
});
