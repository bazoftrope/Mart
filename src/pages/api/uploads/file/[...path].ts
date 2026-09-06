import type { NextApiRequest, NextApiResponse } from 'next';
import { apiHandler } from '@/lib/apiHandler';
import { NotFound } from '@/lib/errors';
import { resolveUploadPath } from '@/lib/fileUpload';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path as string];
  const fullPath = resolveUploadPath(parts.map((p) => p as string));

  if (!fullPath) {
    throw new NotFound('File not found');
  }

  const stat = fs.statSync(fullPath);
  const isPdf = fullPath.toLowerCase().endsWith('.pdf');

  res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'application/octet-stream');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  if (isPdf) {
    res.setHeader('Content-Disposition', 'inline');
  }

  const range = req.headers.range;
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
      if (start >= 0 && start < stat.size && end >= start) {
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        res.setHeader('Content-Length', end - start + 1);
        fs.createReadStream(fullPath, { start, end }).pipe(res);
        return;
      }
    }
  }

  fs.createReadStream(fullPath).pipe(res);
}

export default apiHandler({
  GET: getHandler,
});
