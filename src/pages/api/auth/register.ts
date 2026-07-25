import '@/lib/db';
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@db/models/User';
import { apiHandler, success } from '@/lib/apiHandler';
import { Conflict } from '@/lib/errors';
import { registerSchema } from '@/lib/validate';
import {
  hashPassword,
  setAuthCookies,
  toPublicUser,
  isAdminCredential,
} from '@/lib/auth';

async function post(req: NextApiRequest, res: NextApiResponse) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { email, password, name, role } = parsed.data;

  if (isAdminCredential(email)) {
    throw new Conflict('This email is reserved for admin login');
  }

  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new Conflict('User with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role,
    name,
    timezone: 'Europe/Moscow',
  });

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  setAuthCookies(res, payload);

  return success(res, { user: toPublicUser(user) }, 201);
}

export default apiHandler({ POST: post });
