import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withMentor } from '@/lib/middleware';
import { MarathonTemplate } from '@db/models/MarathonTemplate';
import { marathonTemplateSchema } from '@/lib/validate';
import type { AuthenticatedRequest } from '@/types/auth';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as AuthenticatedRequest).user;

  const templates = await MarathonTemplate.findAll({
    where: { mentorId: user.userId },
    order: [['created_at', 'DESC']],
  });

  const data = templates.map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    durationDays: template.durationDays,
    status: template.status,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }));

  return success(res, data);
}

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as AuthenticatedRequest).user;

  const parsed = marathonTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { title, description, durationDays } = parsed.data;

  const template = await MarathonTemplate.create({
    mentorId: user.userId,
    title,
    description,
    durationDays,
    status: 'draft',
  });

  return success(res, {
    id: template.id,
    title: template.title,
    description: template.description,
    durationDays: template.durationDays,
    status: template.status,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }, 201);
}

export default apiHandler({
  GET: withMentor(getHandler),
  POST: withMentor(postHandler),
});
