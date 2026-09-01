import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withMentor } from '@/lib/middleware';
import { MarathonTemplate } from '@db/models/MarathonTemplate';
import { TemplateDay } from '@db/models/TemplateDay';
import { marathonTemplateSchema } from '@/lib/validate';
import { NotFound, Forbidden, BadRequest } from '@/lib/errors';
import type { AuthenticatedRequest } from '@/types/auth';

function getTemplateId(req: NextApiRequest): string {
  const id = req.query.id;
  const templateId = Array.isArray(id) ? id[0] : id;
  if (!templateId) {
    throw new NotFound('Template not found');
  }
  return templateId;
}

async function loadOwnedTemplate(req: NextApiRequest) {
  const user = (req as AuthenticatedRequest).user;
  const templateId = getTemplateId(req);

  const template = await MarathonTemplate.findByPk(templateId);
  if (!template) {
    throw new NotFound('Template not found');
  }

  if (template.mentorId !== user.userId) {
    throw new Forbidden('You do not own this template');
  }

  return template;
}

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const template = await loadOwnedTemplate(req);

  const days = await TemplateDay.findAll({
    where: { templateId: template.id },
    order: [['day_number', 'ASC']],
  });

  return success(res, {
    id: template.id,
    title: template.title,
    description: template.description,
    durationDays: template.durationDays,
    status: template.status,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    days: days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      textContent: day.textContent,
      audioUrl: day.audioUrl,
      videoId: day.videoId,
    })),
  });
}

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const template = await loadOwnedTemplate(req);

  if (template.status !== 'draft') {
    throw new BadRequest('Only draft templates can be edited');
  }

  const parsed = marathonTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { title, description, durationDays } = parsed.data;

  template.title = title;
  template.description = description;
  template.durationDays = durationDays;
  await template.save();

  return success(res, {
    id: template.id,
    title: template.title,
    description: template.description,
    durationDays: template.durationDays,
    status: template.status,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  });
}

async function deleteHandler(req: NextApiRequest, res: NextApiResponse) {
  const template = await loadOwnedTemplate(req);

  if (template.status !== 'draft') {
    throw new BadRequest('Only draft templates can be deleted');
  }

  await template.destroy();

  return success(res, { id: template.id, deleted: true });
}

export default apiHandler({
  GET: withMentor(getHandler),
  PUT: withMentor(putHandler),
  DELETE: withMentor(deleteHandler),
});
