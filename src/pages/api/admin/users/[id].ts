import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withAdmin } from '@/lib/middleware';
import { User } from '@db/models/User';
import { toPublicUser } from '@/lib/auth';
import { updateUserRoleSchema } from '@/lib/validate';
import { BadRequest, NotFound } from '@/lib/errors';
import type { AuthenticatedRequest } from '@/types/auth';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const user = await User.findByPk(id as string);
  if (!user) {
    throw new NotFound('User not found');
  }

  return success(res, toPublicUser(user));
}

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const requestUser = (req as AuthenticatedRequest).user;

  if (requestUser.userId === id) {
    throw new BadRequest('Cannot change your own role');
  }

  const body = updateUserRoleSchema.parse(req.body);

  const user = await User.findByPk(id as string);
  if (!user) {
    throw new NotFound('User not found');
  }

  user.role = body.role;
  await user.save();

  return success(res, toPublicUser(user));
}

export default apiHandler({ GET: withAdmin(getHandler), PUT: withAdmin(putHandler) });
