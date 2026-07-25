import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withAdmin } from '@/lib/middleware';
import { User } from '@db/models/User';
import { toPublicUser } from '@/lib/auth';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const { role } = req.query;

  const where: Record<string, unknown> = {};
  if (role && ['mentor', 'participant', 'admin'].includes(role as string)) {
    where.role = role;
  }

  const users = await User.findAll({
    where,
    order: [['created_at', 'DESC']],
  });

  return success(res, users.map(toPublicUser));
}

export default apiHandler({ GET: withAdmin(getHandler) });
