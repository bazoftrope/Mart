import type { NextApiRequest, NextApiResponse } from 'next';
import '@/lib/db';
import { sequelize } from '@db/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withParticipant } from '@/lib/middleware';
import { BadRequest, Forbidden, NotFound } from '@/lib/errors';
import { saveReportSchema } from '@/lib/validation';
import { DailyReport, ReportLine, Product, StreamEnrollment } from '@db/models';
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
        calories: Number(product.calories),
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
  PUT: withParticipant(putHandler),
});
