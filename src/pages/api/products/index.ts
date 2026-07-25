import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withAuth } from '@/lib/middleware';
import { Product } from '@db/models/Product';

const MAX_RESULTS = 20;

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const where = search
    ? { name: { [Op.iLike]: `%${search}%` } }
    : {};

  const products = await Product.findAll({
    where,
    order: [['name', 'ASC']],
    limit: MAX_RESULTS,
  });

  const data = products.map((product) => ({
    id: product.id,
    name: product.name,
    caloriesPer100g: Number(product.caloriesPer100g),
  }));

  return success(res, data);
}

export default apiHandler({ GET: withAuth(getHandler) });
