import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';
import { apiHandler, success } from '@/lib/apiHandler';

async function get(_req: NextApiRequest, res: NextApiResponse) {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return res.status(500).json({
      success: false,
      error: 'CONFIGURATION_ERROR',
      message: 'DATABASE_URL is not set',
    });
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as now');
    await client.end();

    return success(res, {
      status: 'ok',
      timestamp: result.rows[0].now,
      database: 'connected',
    });
  } catch (error) {
    await client.end().catch(() => null);

    return res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default apiHandler({ GET: get });
