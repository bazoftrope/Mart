import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { apiHandler, success } from '@/lib/apiHandler';
import { withMentor } from '@/lib/middleware';
import { MarathonTemplate } from '@db/models/MarathonTemplate';
import { NotFound, Forbidden, BadRequest } from '@/lib/errors';
import type { AuthenticatedRequest } from '@/types/auth';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_MIME,
  MAX_AUDIO_SIZE_BYTES,
  ALLOWED_AUDIO_MIME,
  parseMultipart,
  fileExtensionFromMimeOrFilename,
  audioExtensionFromMimeOrFilename,
  safeFilename,
  buildUploadUrl,
  getTemplateUploadDir,
  ensureUploadRoot,
  validateUploadedFile,
  type UploadedFile,
} from '@/lib/fileUpload';

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

function isPdfFile(file: UploadedFile): boolean {
  return Boolean(
    ALLOWED_FILE_MIME[file.contentType.toLowerCase()] ||
      fileExtensionFromMimeOrFilename(file.contentType, file.filename),
  );
}

function isAudioFile(file: UploadedFile): boolean {
  return Boolean(
    ALLOWED_AUDIO_MIME[file.contentType.toLowerCase()] ||
      audioExtensionFromMimeOrFilename(file.contentType, file.filename),
  );
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

  if (parsed.files.length !== 2) {
    throw new BadRequest('Для комплекта нужны ровно два файла: PDF и аудио');
  }

  const pdfIndex = parsed.files.findIndex(isPdfFile);
  const pdfFile = pdfIndex >= 0 ? parsed.files[pdfIndex] : undefined;
  const audioFile = parsed.files.find(
    (file, index) => index !== pdfIndex && isAudioFile(file),
  );
  if (!pdfFile || !audioFile) {
    throw new BadRequest('Для комплекта нужны один PDF-файл и один аудиофайл');
  }

  validateUploadedFile(pdfFile, {
    maxBytes: MAX_FILE_SIZE_BYTES,
    allowedMime: ALLOWED_FILE_MIME,
    label: 'PDF',
  });
  validateUploadedFile(audioFile, {
    maxBytes: MAX_AUDIO_SIZE_BYTES,
    allowedMime: ALLOWED_AUDIO_MIME,
    label: 'аудио',
  });

  const template = await loadOwnedTemplate(user, templateId);
  const dir = getTemplateUploadDir(template.id);
  ensureUploadRoot();
  fs.mkdirSync(dir, { recursive: true });

  const pdfMimeExt = ALLOWED_FILE_MIME[pdfFile.contentType.toLowerCase()];
  const pdfExt = fileExtensionFromMimeOrFilename(pdfFile.contentType, pdfFile.filename);
  const pdfFilename = safeFilename(pdfExt || pdfMimeExt || '.pdf');
  fs.writeFileSync(path.join(dir, pdfFilename), pdfFile.data);

  const audioMimeExt = ALLOWED_AUDIO_MIME[audioFile.contentType.toLowerCase()];
  const audioExt = audioExtensionFromMimeOrFilename(audioFile.contentType, audioFile.filename);
  const audioFilename = safeFilename(audioExt || audioMimeExt || '.bin');
  fs.writeFileSync(path.join(dir, audioFilename), audioFile.data);

  return success(
    res,
    {
      pairId: crypto.randomUUID(),
      pdf: {
        url: buildUploadUrl('file', template.id, pdfFilename),
        fileName: pdfFile.filename,
        mimeType: pdfFile.contentType,
        sizeBytes: pdfFile.data.length,
      },
      audio: {
        url: buildUploadUrl('audio', template.id, audioFilename),
        fileName: audioFile.filename,
        mimeType: audioFile.contentType,
        sizeBytes: audioFile.data.length,
      },
    },
    201,
  );
}

export default apiHandler({
  POST: withMentor(postHandler),
});
