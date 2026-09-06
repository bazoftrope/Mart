import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BadRequest } from './errors';

export const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_AUDIO_MIME: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'audio/webm': '.webm',
  'audio/x-wav': '.wav',
};

export function getUploadRoot(): string {
  return process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.resolve(process.cwd(), 'data', 'uploads', 'audio');
}

export function getTemplateAudioDir(templateId: string): string {
  return path.join(getUploadRoot(), templateId);
}

export function ensureUploadRoot(): void {
  fs.mkdirSync(getUploadRoot(), { recursive: true });
}

export function resolveAudioPath(relativeParts: string[]): string | null {
  const root = getUploadRoot();
  const full = path.resolve(root, ...relativeParts);
  const normalizedRoot = path.normalize(root);
  if (!full.startsWith(normalizedRoot + path.sep) && full !== normalizedRoot) {
    return null;
  }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return null;
  }
  return full;
}

export function extensionFromFilename(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  const byExt: Record<string, string> = {
    '.mp3': '.mp3',
    '.m4a': '.m4a',
    '.ogg': '.ogg',
    '.wav': '.wav',
    '.webm': '.webm',
  };
  return byExt[ext] || null;
}

export function buildAudioUrl(templateId: string, filename: string): string {
  return `/api/uploads/audio/${templateId}/${filename}`;
}

export type MultipartResult = {
  fields: Record<string, string>;
  files: {
    filename: string;
    contentType: string;
    data: Buffer;
  }[];
};

export async function parseMultipart(
  buffer: Buffer,
  contentType: string | undefined
): Promise<MultipartResult> {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!match) {
    throw new BadRequest('Неверный формат запроса (boundary)');
  }

  const boundary = `--${(match[1] || match[2] || '').trim()}`;
  const parts = buffer
    .toString('latin1')
    .split(boundary)
    .map((part) => part.replace(/\r\n$/, ''))
    .filter((part) => part !== '--' && part.trim() !== '');

  const result: MultipartResult = { fields: {}, files: [] };

  function parseHeaderBlock(raw: string): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const line of raw.split('\r\n')) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    }
    return headers;
  }

  for (const part of parts) {
    const sepIndex = part.indexOf('\r\n\r\n');
    if (sepIndex === -1) continue;

    const headerRaw = part.slice(0, sepIndex);
    const body = part.slice(sepIndex + 4);

    // Multipart headers передаются как «сырые» байты. Мы читали их через latin1,
    // поэтому кириллические filename были вида «ÐÐºÑ...». Декодируем шапку обратно в UTF-8.
    const headerBlock = Buffer.from(headerRaw, 'latin1').toString('utf8');
    const headers = parseHeaderBlock(headerBlock);
    const disposition = headers['content-disposition'] || '';
    const nameMatch = /name="([^"]*)"/.exec(disposition);
    const filenameMatch = /filename="([^"]*)"/.exec(disposition);

    if (!nameMatch) continue;
    const name = nameMatch[1];

    if (filenameMatch && filenameMatch[1]) {
      result.files.push({
        filename: filenameMatch[1],
        contentType: headers['content-type'] || 'application/octet-stream',
        data: Buffer.from(body, 'latin1'),
      });
    } else {
      result.fields[name] = body.trim();
    }
  }

  return result;
}

export function safeAudioFilename(templateId: string, dayNumber: number, ext: string): string {
  const rand = crypto.randomBytes(8).toString('hex');
  return `${dayNumber}-${rand}${ext}`;
}
