import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withMentor } from '@/lib/middleware';
import { Stream, MarathonTemplate, User } from '@db/models';
import { createStreamSchema } from '@/lib/validate';
import { Forbidden, NotFound } from '@/lib/errors';
import type { AuthenticatedRequest } from '@/types/auth';
import { Op } from 'sequelize';

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as AuthenticatedRequest).user;

  const parsed = createStreamSchema.safeParse(req.body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { templateId, startDate } = parsed.data;

  const template = await MarathonTemplate.findByPk(templateId);
  if (!template) {
    throw new NotFound('Template not found');
  }

  if (template.mentorId !== user.userId) {
    throw new Forbidden('You can only create streams from your own templates');
  }

  if (template.status !== 'approved') {
    throw new Forbidden('Only approved templates can be launched');
  }

  const stream = await Stream.create({
    templateId,
    startDate,
    status: 'open',
  });

  return success(res, {
    id: stream.id,
    templateId: stream.templateId,
    startDate: stream.startDate,
    status: stream.status,
    createdAt: stream.createdAt,
  }, 201);
}

async function getHandler(_req: NextApiRequest, res: NextApiResponse) {
  const streams = await Stream.findAll({
    where: {
      status: {
        [Op.in]: ['open', 'running'],
      },
    },
    order: [['start_date', 'ASC']],
  });

  const templateIds = Array.from(new Set(streams.map((s) => s.templateId)));
  const templates = await MarathonTemplate.findAll({
    where: { id: templateIds },
  });
  const templateMap = new Map(templates.map((t) => [t.id, t]));

  const mentorIds = Array.from(new Set(templates.map((t) => t.mentorId)));
  const mentors = await User.findAll({
    where: { id: mentorIds },
    attributes: ['id', 'name', 'email'],
  });
  const mentorMap = new Map(mentors.map((m) => [m.id, m]));

  const data = streams.map((stream) => {
    const template = templateMap.get(stream.templateId);
    const mentor = template ? mentorMap.get(template.mentorId) : null;

    return {
      id: stream.id,
      startDate: stream.startDate,
      status: stream.status,
      template: template
        ? {
            id: template.id,
            title: template.title,
            description: template.description,
            durationDays: template.durationDays,
          }
        : null,
      mentor: mentor
        ? {
            id: mentor.id,
            name: mentor.name,
            email: mentor.email,
          }
        : null,
    };
  });

  return success(res, data);
}

export default apiHandler({
  POST: withMentor(postHandler),
  GET: getHandler,
});
