import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withAdmin } from '@/lib/middleware';
import { MarathonTemplate } from '@db/models/MarathonTemplate';
import { User } from '@db/models/User';
import { toPublicUser } from '@/lib/auth';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const templates = await MarathonTemplate.findAll({
    where: { status: 'pending_review' },
    order: [['created_at', 'DESC']],
  });

  const mentorIds = Array.from(new Set(templates.map((t) => t.mentorId)));
  const mentors = mentorIds.length
    ? await User.findAll({ where: { id: mentorIds } })
    : [];

  const mentorById = new Map(mentors.map((m) => [m.id, toPublicUser(m)]));

  const data = templates.map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    durationDays: template.durationDays,
    status: template.status,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    mentor: mentorById.get(template.mentorId) || null,
  }));

  return success(res, data);
}

export default apiHandler({ GET: withAdmin(getHandler) });
