import type { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler, success } from '@/lib/apiHandler';
import { clearAuthCookies } from '@/lib/auth';

async function post(_req: NextApiRequest, res: NextApiResponse) {
  clearAuthCookies(res);
  return success(res, { ok: true });
}

export default apiHandler({ POST: post });
