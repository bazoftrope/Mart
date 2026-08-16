import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withParticipant } from '@/lib/middleware';
import { Forbidden, NotFound } from '@/lib/errors';
import { getCurrentDayNumber, isDayAccessible } from '@/lib/calendar';
import {
  Stream,
  MarathonTemplate,
  TemplateDay,
  StreamEnrollment,
  DailyReport,
  ReportLine,
  Product,
  PulseReading,
  User,
} from '@db/models';
import type { AuthenticatedRequest } from '@/types/auth';

type ReportLineItem = {
  id: string;
  productId: string;
  name: string;
  calories: number;
  weightGrams: number;
  lineCalories: number;
};

type PulseReadingItem = { id: string; measuredAt: Date; pulse: number };

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;

  const rawId = req.query.id;
  const streamId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!streamId) {
    throw new NotFound('Stream not found');
  }

  const [currentUser, stream, enrollment] = await Promise.all([
    User.findByPk(user.userId, { attributes: ['id', 'timezone'] }),
    Stream.findByPk(streamId),
    StreamEnrollment.findOne({
      where: { streamId, participantId: user.userId },
    }),
  ]);

  if (!currentUser) {
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

  const currentDayNumber = getCurrentDayNumber(
    stream.startDate,
    currentUser.timezone,
    template.durationDays
  );

  const [templateDays, reports] = await Promise.all([
    TemplateDay.findAll({
      where: { templateId: template.id },
      order: [['dayNumber', 'ASC']],
    }),
    DailyReport.findAll({
      where: { enrollmentId: enrollment.id },
      order: [['dayNumber', 'ASC']],
    }),
  ]);

  const templateDayMap = new Map(templateDays.map((d) => [d.dayNumber, d]));
  const reportMap = new Map(reports.map((r) => [r.dayNumber, r]));

  const reportIds = reports.map((r) => r.id);
  const [reportLines, reportPulseReadings] = reportIds.length
    ? await Promise.all([
        ReportLine.findAll({ where: { reportId: reportIds } }),
        PulseReading.findAll({
          where: { reportId: reportIds },
          order: [['measured_at', 'ASC']],
        }),
      ])
    : [[], []];

  const productIds = reportLines.map((line) => line.productId);
  const products = productIds.length
    ? await Product.findAll({ where: { id: productIds } })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  const linesByReport = new Map<string, ReportLineItem[]>();
  for (const line of reportLines) {
    const list = linesByReport.get(line.reportId) ?? [];
    const product = productMap.get(line.productId);
    list.push({
      id: line.id,
      productId: line.productId,
      name: product?.name || 'Unknown product',
      calories: Number(product?.calories || 0),
      weightGrams: Number(line.weightGrams),
      lineCalories: Number(line.lineCalories),
    });
    linesByReport.set(line.reportId, list);
  }

  const pulseByReport = new Map<string, PulseReadingItem[]>();
  for (const reading of reportPulseReadings) {
    const list = pulseByReport.get(reading.reportId) ?? [];
    list.push({
      id: reading.id,
      measuredAt: reading.measuredAt,
      pulse: reading.pulse,
    });
    pulseByReport.set(reading.reportId, list);
  }

  const days = Array.from({ length: template.durationDays }, (_, i) => {
    const dayNumber = i + 1;
    const templateDay = templateDayMap.get(dayNumber) ?? null;
    const report = reportMap.get(dayNumber) ?? null;
    const lines = report ? (linesByReport.get(report.id) ?? []) : [];
    const pulseReadings = report ? (pulseByReport.get(report.id) ?? []) : [];

    return {
      streamId: stream.id,
      dayNumber,
      currentDayNumber,
      isEditable: isDayAccessible(dayNumber, currentDayNumber),
      stream: {
        template: {
          title: template.title,
        },
      },
      day: templateDay
        ? {
            textContent: templateDay.textContent || null,
            audioUrl: templateDay.audioUrl || null,
            videoUrl: templateDay.videoUrl || null,
          }
        : null,
      report: report
        ? {
            id: report.id,
            totalCalories: Number(report.totalCalories),
            filledAt: report.filledAt,
            updatedAt: report.updatedAt,
            waterLiters: report.waterLiters,
            steps: report.steps,
            sleepHours: report.sleepHours,
            activityMinutes: report.activityMinutes,
            weightKg: report.weightKg,
            chestCm: report.chestCm,
            waistCm: report.waistCm,
            hipCm: report.hipCm,
            legCm: report.legCm,
            pulseReadings,
            lines,
          }
        : null,
    };
  });

  return success(res, {
    streamId: stream.id,
    days,
  });
}

export default apiHandler({
  GET: withParticipant(getHandler),
});