import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { sequelize } from '@db/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withParticipant } from '@/lib/middleware';
import { BadRequest, Forbidden, NotFound } from '@/lib/errors';
import { saveReportSchema } from '@/lib/validation';
import { buildMeasuredAtUtc } from '@/lib/calendar';
import {
  DailyReport,
  ReportLine,
  Product,
  PulseReading,
  StreamEnrollment,
  Stream,
  User,
} from '@db/models';
import type { AuthenticatedRequest } from '@/types/auth';

function parseReportId(req: NextApiRequest): string {
  const raw = req.query.reportId;
  const reportId = Array.isArray(raw) ? raw[0] : raw;
  if (!reportId) {
    throw new NotFound('Report not found');
  }
  return reportId;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;
  const reportId = parseReportId(req);

  const report = await DailyReport.findByPk(reportId);
  if (!report) {
    throw new NotFound('Report not found');
  }

  const enrollment = await StreamEnrollment.findByPk(report.enrollmentId);
  if (!enrollment || enrollment.participantId !== user.userId) {
    throw new Forbidden('You do not have access to this report');
  }

  const [stream, currentUser] = await Promise.all([
    Stream.findByPk(enrollment.streamId),
    User.findByPk(user.userId, { attributes: ['id', 'timezone'] }),
  ]);

  if (!stream) {
    throw new NotFound('Stream not found');
  }
  if (!currentUser) {
    throw new NotFound('User not found');
  }

  const body = saveReportSchema.parse(req.body);
  const lines = body.lines ?? [];
  const {
    waterLiters,
    steps,
    sleepHours,
    activityMinutes,
    weightKg,
    pulseReadings,
  } = body;

  const productIds = lines.map((line) => line.productId);
  const products = productIds.length
    ? await Product.findAll({ where: { id: productIds } })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalCalories = 0;
  const lineRecords = lines.map((line) => {
    const product = productMap.get(line.productId);
    if (!product) {
      throw new BadRequest(`Product ${line.productId} not found`);
    }
    const lineCalories = round2(
      (line.weightGrams * Number(product.calories)) / 100
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
    report.totalCalories = totalCalories;
    report.waterLiters = waterLiters ?? null;
    report.steps = steps ?? null;
    report.sleepHours = sleepHours ?? null;
    report.activityMinutes = activityMinutes ?? null;
    report.weightKg = weightKg ?? null;
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

    await PulseReading.destroy({
      where: { reportId: report.id },
      transaction,
    });

    const pulseRecords =
      pulseReadings?.map((reading) => ({
        reportId: report.id,
        measuredAt: buildMeasuredAtUtc(
          stream.startDate,
          report.dayNumber,
          reading.measuredAt,
          currentUser.timezone
        ),
        pulse: reading.pulse,
      })) ?? [];

    const createdPulse = pulseRecords.length
      ? await PulseReading.bulkCreate(pulseRecords, { transaction })
      : [];

    await transaction.commit();

    const savedLines = lineRecords.map((record) => {
      const product = productMap.get(record.productId)!;
      return {
        productId: record.productId,
        name: product.name,
        calories: Number(product.calories),
        weightGrams: record.weightGrams,
        lineCalories: record.lineCalories,
      };
    });

    createdPulse.sort(
      (a, b) => a.measuredAt.getTime() - b.measuredAt.getTime()
    );

    return success(res, {
      id: report.id,
      totalCalories,
      filledAt: report.filledAt,
      updatedAt: report.updatedAt,
      waterLiters: report.waterLiters,
      steps: report.steps,
      sleepHours: report.sleepHours,
      activityMinutes: report.activityMinutes,
      weightKg: report.weightKg,
      pulseReadings: createdPulse.map((p) => ({
        id: p.id,
        measuredAt: p.measuredAt,
        pulse: p.pulse,
      })),
      lines: savedLines,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export default apiHandler({
  PUT: withParticipant(putHandler),
});
