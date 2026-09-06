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

const MIME_BY_EXT: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
};

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path as string];
  const fullPath = resolveUploadPath(parts.map((p) => p as string));

  if (!fullPath) {
    throw new NotFound('Audio not found');
  }

  const ext = Object.keys(MIME_BY_EXT).find((key) => fullPath.toLowerCase().endsWith(key));
  const mime = ext ? MIME_BY_EXT[ext] : 'application/octet-stream';
  const stat = fs.statSync(fullPath);

  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

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
