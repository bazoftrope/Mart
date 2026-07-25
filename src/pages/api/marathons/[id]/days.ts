import type { NextApiRequest, NextApiResponse } from 'next';
import { Transaction } from 'sequelize';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withMentor } from '@/lib/middleware';
import { MarathonTemplate } from '@db/models/MarathonTemplate';
import { TemplateDay } from '@db/models/TemplateDay';
import { updateTemplateDaysSchema } from '@/lib/validate';
import { NotFound, Forbidden, BadRequest } from '@/lib/errors';
import { sequelize } from '@db/db';
import type { AuthenticatedRequest } from '@/types/auth';

async function loadOwnedTemplate(req: NextApiRequest) {
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

  return template;
}

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const template = await loadOwnedTemplate(req);

  const days = await TemplateDay.findAll({
    where: { templateId: template.id },
    order: [['day_number', 'ASC']],
  });

  return success(res, days.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    textContent: day.textContent,
    audioUrl: day.audioUrl,
    videoUrl: day.videoUrl,
  })));
}

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const template = await loadOwnedTemplate(req);

  if (template.status !== 'draft') {
    throw new BadRequest('Only draft templates can be edited');
  }

  const parsed = updateTemplateDaysSchema.safeParse(req.body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const { days } = parsed.data;

  const dayNumbers = days.map((day) => day.dayNumber);
  const uniqueDayNumbers = new Set(dayNumbers);
  if (uniqueDayNumbers.size !== dayNumbers.length) {
    throw new BadRequest('Day numbers must be unique');
  }

  if (days.length !== template.durationDays) {
    throw new BadRequest(`Expected ${template.durationDays} days, but received ${days.length}`);
  }

  const result = await sequelize.transaction(async (transaction: Transaction) => {
    await TemplateDay.destroy({
      where: { templateId: template.id },
      transaction,
    });

    const createdDays = await TemplateDay.bulkCreate(
      days.map((day) => ({
        templateId: template.id,
        dayNumber: day.dayNumber,
        textContent: day.textContent,
        audioUrl: day.audioUrl,
        videoUrl: day.videoUrl,
      })),
      { transaction }
    );

    return createdDays;
  });

  return success(res, result.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    textContent: day.textContent,
    audioUrl: day.audioUrl,
    videoUrl: day.videoUrl,
  })));
}

export default apiHandler({
  GET: withMentor(getHandler),
  POST: withMentor(postHandler),
});
