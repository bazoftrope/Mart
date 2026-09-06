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
  parseMultipart,
  audioExtensionFromMimeOrFilename,
  safeFilename,
  buildUploadUrl,
  getTemplateUploadDir,
  ensureUploadRoot,
  validateUploadedFile,
} from '@/lib/fileUpload';
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
  if (!templateId) {
    throw new BadRequest('Укажите templateId');
  }

  if (parsed.files.length === 0) {
    throw new BadRequest('Файл аудио не передан');
  }

  const template = await loadOwnedTemplate(user, templateId);
  const dir = getTemplateUploadDir(template.id);
  ensureUploadRoot();
  fs.mkdirSync(dir, { recursive: true });

  const files = parsed.files.map((file) => {
    validateUploadedFile(file, {
      maxBytes: MAX_AUDIO_SIZE_BYTES,
      allowedMime: ALLOWED_AUDIO_MIME,
      label: 'аудио',
    });

    const mimeExt = ALLOWED_AUDIO_MIME[file.contentType.toLowerCase()];
    const ext = audioExtensionFromMimeOrFilename(file.contentType, file.filename);
    if (!mimeExt && !ext) {
      throw new BadRequest('Неподдерживаемый тип аудиофайла');
    }

    const filename = safeFilename(ext || mimeExt || '.bin');
    fs.writeFileSync(path.join(dir, filename), file.data);

    return {
      url: buildUploadUrl('audio', template.id, filename),
      fileName: file.filename,
      mimeType: file.contentType,
      sizeBytes: file.data.length,
    };
  });

  return success(res, { files }, 201);
}

export default apiHandler({
  POST: withMentor(postHandler),
});
