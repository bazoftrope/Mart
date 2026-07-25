import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withAdmin } from '@/lib/middleware';
import { calculateAllRatings } from '@/lib/ratingCalculator';

async function postHandler(_req: NextApiRequest, res: NextApiResponse) {
  const result = await calculateAllRatings();
  return success(res, result);
}

export default apiHandler({
  POST: withAdmin(postHandler),
});
