import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { sequelize } from '@db/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withParticipant } from '@/lib/middleware';
import { BadRequest, Forbidden, NotFound } from '@/lib/errors';
import { saveReportSchema } from '@/lib/validation';
import { getCurrentDayNumber, isDayAccessible } from '@/lib/calendar';
import {
  Stream,
  MarathonTemplate,
  TemplateDay,
  StreamEnrollment,
  DailyReport,
  ReportLine,
  Product,
  User,
} from '@db/models';
import type { AuthenticatedRequest } from '@/types/auth';

function parseParams(req: NextApiRequest): { streamId: string; dayNumber: number } {
  const rawId = req.query.id;
  const streamId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!streamId) {
    throw new NotFound('Stream not found');
  }

  const rawDay = req.query.dayNumber;
  const dayStr = Array.isArray(rawDay) ? rawDay[0] : rawDay;
  if (!dayStr || !/^\d+$/.test(dayStr)) {
    throw new BadRequest('Invalid day number');
  }
  const dayNumber = parseInt(dayStr, 10);

  return { streamId, dayNumber };
}

async function loadParticipantContext(userId: string, streamId: string) {
  const [user, stream, enrollment] = await Promise.all([
    User.findByPk(userId, { attributes: ['id', 'timezone'] }),
    Stream.findByPk(streamId),
    StreamEnrollment.findOne({
      where: { streamId, participantId: userId },
    }),
  ]);

  if (!user) {
    throw new NotFound('User not found');
  }
  if (!stream) {
    throw new NotFound('Stream not found');
  }
  if (!enrollment) {
    throw new Forbidden('You are not enrolled in this stream');
  }

  const template = await MarathonTemplate.findByPk(stream.templateId);
  if (!template) {
    throw new NotFound('Template not found');
  }

  return { currentUser: user, stream, enrollment, template };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;
  const { streamId, dayNumber } = parseParams(req);

  const { currentUser, stream, enrollment, template } = await loadParticipantContext(
    user.userId,
    streamId
  );

  if (dayNumber < 1 || dayNumber > template.durationDays) {
    throw new BadRequest(
      `Day number must be between 1 and ${template.durationDays}`
    );
  }

  const currentDayNumber = getCurrentDayNumber(
    stream.startDate,
    currentUser.timezone,
    template.durationDays
  );

  const [day, report] = await Promise.all([
    TemplateDay.findOne({
      where: { templateId: template.id, dayNumber },
    }),
    DailyReport.findOne({
      where: { enrollmentId: enrollment.id, dayNumber },
    }),
  ]);

  let lines: Array<{
    id: string;
    productId: string;
    name: string;
    caloriesPer100g: number;
    weightGrams: number;
    lineCalories: number;
  }> = [];

  if (report) {
    const reportLines = await ReportLine.findAll({
      where: { reportId: report.id },
    });
    const productIds = reportLines.map((line) => line.productId);
    const products = productIds.length
      ? await Product.findAll({ where: { id: productIds } })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    lines = reportLines.map((line) => {
      const product = productMap.get(line.productId);
      return {
        id: line.id,
        productId: line.productId,
        name: product?.name || 'Unknown product',
        caloriesPer100g: Number(product?.caloriesPer100g || 0),
        weightGrams: Number(line.weightGrams),
        lineCalories: Number(line.lineCalories),
      };
    });
  }

  return success(res, {
    streamId: stream.id,
    dayNumber,
    currentDayNumber,
    isEditable: isDayAccessible(dayNumber, currentDayNumber),
    day: day
      ? {
          textContent: day.textContent || null,
          audioUrl: day.audioUrl || null,
          videoUrl: day.videoUrl || null,
        }
      : null,
    report: report
      ? {
          id: report.id,
          totalCalories: Number(report.totalCalories),
          filledAt: report.filledAt,
          updatedAt: report.updatedAt,
          lines,
        }
      : null,
  });
}

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;
  const { streamId, dayNumber } = parseParams(req);

  const { currentUser, stream, enrollment, template } = await loadParticipantContext(
    user.userId,
    streamId
  );

  if (dayNumber < 1 || dayNumber > template.durationDays) {
    throw new BadRequest(
      `Day number must be between 1 and ${template.durationDays}`
    );
  }

  const currentDayNumber = getCurrentDayNumber(
    stream.startDate,
    currentUser.timezone,
    template.durationDays
  );
  if (!isDayAccessible(dayNumber, currentDayNumber)) {
    throw new Forbidden('This day is not yet available');
  }

  const body = saveReportSchema.parse(req.body);

  const productIds = body.lines.map((line) => line.productId);
  const products = productIds.length
    ? await Product.findAll({ where: { id: productIds } })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalCalories = 0;
  const lineRecords = body.lines.map((line) => {
    const product = productMap.get(line.productId);
    if (!product) {
      throw new BadRequest(`Product ${line.productId} not found`);
    }
    const lineCalories = round2(
      (line.weightGrams * Number(product.caloriesPer100g)) / 100
    );
    totalCalories += lineCalories;
    return {
      productId: line.productId,
      weightGrams: line.weightGrams,
      lineCalories,
    };
  });
  totalCalories = round2(totalCalories);

  const transaction = await sequelize.transaction();
  try {
    const [report] = await DailyReport.findOrCreate({
      where: { enrollmentId: enrollment.id, dayNumber },
      defaults: {
        enrollmentId: enrollment.id,
        dayNumber,
        totalCalories,
      },
      transaction,
    });

    report.totalCalories = totalCalories;
    await report.save({ transaction });

    await ReportLine.destroy({
      where: { reportId: report.id },
      transaction,
    });

    await ReportLine.bulkCreate(
      lineRecords.map((record) => ({
        ...record,
        reportId: report.id,
      })),
      { transaction }
    );

    await transaction.commit();

    const savedLines = lineRecords.map((record) => {
      const product = productMap.get(record.productId)!;
      return {
        productId: record.productId,
        name: product.name,
        caloriesPer100g: Number(product.caloriesPer100g),
        weightGrams: record.weightGrams,
        lineCalories: record.lineCalories,
      };
    });

    return success(res, {
      id: report.id,
      totalCalories,
      filledAt: report.filledAt,
      updatedAt: report.updatedAt,
      lines: savedLines,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export default apiHandler({
  GET: withParticipant(getHandler),
  POST: withParticipant(postHandler),
});
