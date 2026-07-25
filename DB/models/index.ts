import { Sequelize } from 'sequelize-typescript';
import { User } from './User';
import { Product } from './Product';
import { MarathonTemplate } from './MarathonTemplate';
import { TemplateDay } from './TemplateDay';
import { Stream } from './Stream';
import { StreamEnrollment } from './StreamEnrollment';
import { DailyReport } from './DailyReport';
import { ReportLine } from './ReportLine';
import { StreamRating } from './StreamRating';

export * from './User';
export * from './Product';
export * from './MarathonTemplate';
export * from './TemplateDay';
export * from './Stream';
export * from './StreamEnrollment';
export * from './DailyReport';
export * from './ReportLine';
export * from './StreamRating';

export const models = {
  User,
  Product,
  MarathonTemplate,
  TemplateDay,
  Stream,
  StreamEnrollment,
  DailyReport,
  ReportLine,
  StreamRating,
};

export type AppModels = typeof models;
