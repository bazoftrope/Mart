import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withMentor } from '@/lib/middleware';
import { MarathonTemplate } from '@db/models/MarathonTemplate';
import { NotFound, Forbidden, BadRequest } from '@/lib/errors';
import type { AuthenticatedRequest } from '@/types/auth';
import {
  MAX_AUDIO_SIZE_BYTES,
  ALLOWED_AUDIO_MIME,
  ensureUploadRoot,
  getTemplateAudioDir,
  parseMultipart,
  safeAudioFilename,
  buildAudioUrl,
  extensionFromFilename,
} from '@/lib/audioUpload';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function loadOwnedTemplate(user: AuthenticatedRequest['user'], templateId: string) {
  const template = await MarathonTemplate.findByPk(templateId);
  if (!template) {
    throw new NotFound('Template not found');
  }
  if (template.mentorId !== user.userId) {
    throw new Forbidden('You do not own this template');
  }
  return template;
}

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as AuthenticatedRequest).user;
  const body = await readRawBody(req);
  const contentType = req.headers['content-type'];

  const parsed = await parseMultipart(body, contentType);

  const templateId = parsed.fields.templateId;
  const dayNumberRaw = parsed.fields.dayNumber;
  const file = parsed.files[0];

  if (!templateId || !dayNumberRaw) {
    throw new BadRequest('Укажите templateId и dayNumber');
  }

  const dayNumber = Number(dayNumberRaw);
  if (!Number.isInteger(dayNumber) || dayNumber < 1) {
    throw new BadRequest('Неверный номер дня');
  }

  if (!file) {
    throw new BadRequest('Файл аудио не передан');
  }

  if (file.data.length === 0) {
    throw new BadRequest('Файл пустой');
  }

  if (file.data.length > MAX_AUDIO_SIZE_BYTES) {
    throw new BadRequest(`Файл слишком большой. Максимум ${Math.round(MAX_AUDIO_SIZE_BYTES / 1024 / 1024)} МБ`);
  }

  const mimeExt = ALLOWED_AUDIO_MIME[file.contentType.toLowerCase()];
  const nameExt = extensionFromFilename(file.filename);
  const ext = mimeExt || nameExt;

  if (!ext) {
    throw new BadRequest('Неподдерживаемый тип аудиофайла');
  }

  const template = await loadOwnedTemplate(user, templateId);

  const dir = getTemplateAudioDir(template.id);
  ensureUploadRoot();
  fs.mkdirSync(dir, { recursive: true });
  const filename = safeAudioFilename(template.id, dayNumber, ext);
  fs.writeFileSync(path.join(dir, filename), file.data);

  return success(res, {
    url: buildAudioUrl(template.id, filename),
    templateId: template.id,
    dayNumber,
  }, 201);
}

export default apiHandler({
  POST: withMentor(postHandler),
});
