import '@/lib/db';
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@db/models/User';
import { apiHandler, success } from '@/lib/apiHandler';
import { Unauthorized } from '@/lib/errors';
import { loginSchema } from '@/lib/validate';
import {
  verifyPassword,
  setAuthCookies,
  toPublicUser,
  isAdminCredential,
  validateAdminPassword,
  ensureAdminUser,
} from '@/lib/auth';

async function post(req: NextApiRequest, res: NextApiResponse) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { email, password } = parsed.data;

  let user: User;

  if (isAdminCredential(email)) {
    const isValidAdmin = await validateAdminPassword(password);
    if (!isValidAdmin) {
      throw new Unauthorized('Invalid credentials');
    }
    user = await ensureAdminUser();
  } else {
    const found = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!found) {
      throw new Unauthorized('Invalid credentials');
    }

    const valid = await verifyPassword(password, found.passwordHash);
    if (!valid) {
      throw new Unauthorized('Invalid credentials');
    }

    user = found;
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  setAuthCookies(res, payload);

  return success(res, { user: toPublicUser(user) });
}

export default apiHandler({ POST: post });
