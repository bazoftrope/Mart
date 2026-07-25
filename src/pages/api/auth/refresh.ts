import '@/lib/db';
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@db/models/User';
import { apiHandler, success } from '@/lib/apiHandler';
import { Unauthorized } from '@/lib/errors';
import {
  parseCookies,
  verifyRefreshToken,
  setAuthCookies,
  toPublicUser,
} from '@/lib/auth';

async function post(req: NextApiRequest, res: NextApiResponse) {
  const cookies = parseCookies(req);
  const refreshToken = cookies.mp_refresh_token;

  if (!refreshToken) {
    throw new Unauthorized('No refresh token');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Unauthorized('Invalid refresh token');
  }

  const user = await User.findByPk(payload.userId);
  if (!user || user.role !== payload.role) {
    throw new Unauthorized('User not found');
  }

  const newPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  setAuthCookies(res, newPayload);

  return success(res, { user: toPublicUser(user) });
}

export default apiHandler({ POST: post });
