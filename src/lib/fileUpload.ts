import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BadRequest } from './errors';
import {
  MAX_AUDIO_SIZE_BYTES,
  ALLOWED_AUDIO_MIME,
  parseMultipart,
  extensionFromFilename as audioExtensionFromFilename,
} from './audioUpload';

export { parseMultipart, ALLOWED_AUDIO_MIME };

export const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_MB ?? 25) * 1024 * 1024;

export const ALLOWED_FILE_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
};

export function getUploadRoot(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(process.cwd(), 'data', 'uploads', 'audio');
}

export function getTemplateUploadDir(templateId: string): string {
  return path.join(getUploadRoot(), templateId);
}

export function ensureUploadRoot(): void {
  fs.mkdirSync(getUploadRoot(), { recursive: true });
}

export function resolveUploadPath(relativeParts: string[]): string | null {
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

export function safeFilename(ext: string): string {
  const rand = crypto.randomBytes(12).toString('hex');
  return `${rand}${ext}`;
}

export function buildUploadUrl(kind: 'audio' | 'file', templateId: string, filename: string): string {
  return `/api/uploads/${kind}/${templateId}/${filename}`;
}

export function extensionFromFilename(filename: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  return ext ? ext : null;
}

export function audioExtensionFromMimeOrFilename(
  contentType: string,
  filename: string
): string | null {
  const mimeExt = ALLOWED_AUDIO_MIME[contentType.toLowerCase()];
  return mimeExt || audioExtensionFromFilename(filename);
}

export function fileExtensionFromMimeOrFilename(
  contentType: string,
  filename: string
): string | null {
  const mimeExt = ALLOWED_FILE_MIME[contentType.toLowerCase()];
  if (mimeExt) return mimeExt;
  return path.extname(filename).toLowerCase() === '.pdf' ? '.pdf' : null;
}

export type UploadedFile = {
  filename: string;
  contentType: string;
  data: Buffer;
};

export type UploadedFileMeta = {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export function validateUploadedFile(
  file: UploadedFile | undefined,
  options: {
    maxBytes: number;
    allowedMime: Record<string, string>;
    label: string;
  }
): void {
  if (!file) {
    throw new BadRequest(`Файл ${options.label} не передан`);
  }
  if (file.data.length === 0) {
    throw new BadRequest('Файл пустой');
  }
  if (file.data.length > options.maxBytes) {
    throw new BadRequest(
      `Файл слишком большой. Максимум ${Math.round(options.maxBytes / 1024 / 1024)} МБ`
    );
  }
  if (!options.allowedMime[file.contentType.toLowerCase()]) {
    throw new BadRequest('Неподдерживаемый тип файла');
  }
}

export { MAX_AUDIO_SIZE_BYTES };
