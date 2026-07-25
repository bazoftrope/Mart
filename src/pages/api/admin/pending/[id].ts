import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withAdmin } from '@/lib/middleware';
import { MarathonTemplate } from '@db/models/MarathonTemplate';
import { TemplateDay } from '@db/models/TemplateDay';
import { User } from '@db/models/User';
import { toPublicUser } from '@/lib/auth';
import { NotFound } from '@/lib/errors';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const templateId = Array.isArray(id) ? id[0] : id;

  if (!templateId) {
    throw new NotFound('Template not found');
  }

  const template = await MarathonTemplate.findOne({
    where: { id: templateId, status: 'pending_review' },
  });

  if (!template) {
    throw new NotFound('Template not found');
  }

  const [mentor, days] = await Promise.all([
    User.findByPk(template.mentorId),
    TemplateDay.findAll({
      where: { templateId: template.id },
      order: [['day_number', 'ASC']],
    }),
  ]);

  const data = {
    id: template.id,
    title: template.title,
    description: template.description,
    durationDays: template.durationDays,
    status: template.status,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    mentor: mentor ? toPublicUser(mentor) : null,
    days: days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      textContent: day.textContent,
      audioUrl: day.audioUrl,
      videoUrl: day.videoUrl,
    })),
  };

  return success(res, data);
}

export default apiHandler({ GET: withAdmin(getHandler) });
