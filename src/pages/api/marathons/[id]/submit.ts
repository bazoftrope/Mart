import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withMentor } from '@/lib/middleware';
import { MarathonTemplate } from '@db/models/MarathonTemplate';
import { TemplateDay } from '@db/models/TemplateDay';
import { NotFound, Forbidden, BadRequest } from '@/lib/errors';
import type { AuthenticatedRequest } from '@/types/auth';

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as AuthenticatedRequest).user;

  const id = req.query.id;
  const templateId = Array.isArray(id) ? id[0] : id;
  if (!templateId) {
    throw new NotFound('Template not found');
  }

  const template = await MarathonTemplate.findByPk(templateId);
  if (!template) {
    throw new NotFound('Template not found');
  }

  if (template.mentorId !== user.userId) {
    throw new Forbidden('You do not own this template');
  }

  if (template.status !== 'draft') {
    throw new BadRequest('Only draft templates can be submitted');
  }

  const daysCount = await TemplateDay.count({
    where: { templateId: template.id },
  });

  if (daysCount === 0) {
    throw new BadRequest('Add at least one day before submitting');
  }

  if (daysCount !== template.durationDays) {
    throw new BadRequest(`Expected ${template.durationDays} days, but found ${daysCount}`);
  }

  template.status = 'pending_review';
  await template.save();

  return success(res, {
    id: template.id,
    title: template.title,
    description: template.description,
    durationDays: template.durationDays,
    status: template.status,
    updatedAt: template.updatedAt,
  });
}

export default apiHandler({ POST: withMentor(postHandler) });
