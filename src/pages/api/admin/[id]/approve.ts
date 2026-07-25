import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withAdmin } from '@/lib/middleware';
import { MarathonTemplate } from '@db/models/MarathonTemplate';
import { NotFound, BadRequest } from '@/lib/errors';

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const templateId = Array.isArray(id) ? id[0] : id;

  if (!templateId) {
    throw new NotFound('Template not found');
  }

  const template = await MarathonTemplate.findByPk(templateId);

  if (!template) {
    throw new NotFound('Template not found');
  }

  if (template.status !== 'pending_review') {
    throw new BadRequest('Template is not pending review');
  }

  template.status = 'approved';
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

export default apiHandler({ POST: withAdmin(postHandler) });
