import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withAuth } from '@/lib/middleware';
import { Stream, StreamEnrollment, MarathonTemplate, User } from '@db/models';
import type { AuthenticatedRequest } from '@/types/auth';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as AuthenticatedRequest).user;

  if (user.role === 'mentor') {
    const templates = await MarathonTemplate.findAll({
      where: { mentorId: user.userId },
      attributes: ['id'],
    });
    const templateIds = templates.map((t) => t.id);

    const streams = await Stream.findAll({
      where: { templateId: templateIds },
      order: [['created_at', 'DESC']],
    });

    const allTemplateIds = Array.from(new Set(streams.map((s) => s.templateId)));
    const allTemplates = await MarathonTemplate.findAll({
      where: { id: allTemplateIds },
    });
    const templateMap = new Map(allTemplates.map((t) => [t.id, t]));

    const data = streams.map((stream) => {
      const template = templateMap.get(stream.templateId);
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
      };
    });

    return success(res, data);
  }

  // participant or admin viewing own enrollments
  const enrollments = await StreamEnrollment.findAll({
    where: { participantId: user.userId },
    order: [['enrolled_at', 'DESC']],
  });

  const streamIds = enrollments.map((e) => e.streamId);
  const streams = streamIds.length
    ? await Stream.findAll({ where: { id: streamIds } })
    : [];
  const streamMap = new Map(streams.map((s) => [s.id, s]));

  const templateIds = Array.from(new Set(streams.map((s) => s.templateId)));
  const templates = templateIds.length
    ? await MarathonTemplate.findAll({ where: { id: templateIds } })
    : [];
  const templateMap = new Map(templates.map((t) => [t.id, t]));

  const mentorIds = Array.from(new Set(templates.map((t) => t.mentorId)));
  const mentors = mentorIds.length
    ? await User.findAll({ where: { id: mentorIds }, attributes: ['id', 'name', 'email'] })
    : [];
  const mentorMap = new Map(mentors.map((m) => [m.id, m]));

  const data = enrollments.map((enrollment) => {
    const stream = streamMap.get(enrollment.streamId);
    const template = stream ? templateMap.get(stream.templateId) : null;
    const mentor = template ? mentorMap.get(template.mentorId) : null;

    return {
      id: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      goal: enrollment.goal,
      targetCalories: enrollment.targetCalories,
      stream: stream
        ? {
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
              ? { id: mentor.id, name: mentor.name, email: mentor.email }
              : null,
          }
        : null,
    };
  });

  return success(res, data);
}

export default apiHandler({
  GET: withAuth(getHandler),
});
