import type { ReportLineItem } from '@/components/ReportTable';
import type { PulseFormItem } from '@/components/PulseReadingsForm';
import type { AttachmentData } from '@/types/attachments';

export type Goal = 'lose' | 'maintain' | 'gain';

export type DayMaterialsData = {
  textContent: string | null;
  attachments: AttachmentData[];
};

export type PulseReadingItem = {
  id?: string;
  measuredAt: string;
  pulse: number;
  systolic?: number | null;
  diastolic?: number | null;
};

export type DayReportData = {
  id: string;
  totalCalories: number;
  filledAt: string;
  updatedAt: string;
  waterLiters: number | null;
  steps: number | null;
  sleepHours: number | null;
  activityMinutes: number | null;
  trainingDone: boolean | null;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  legCm: number | null;
  pulseReadings: PulseReadingItem[];
  lines: ReportLineItem[];
};

export type MetricsState = {
  waterLiters: number | '';
  steps: number | '';
  sleepHours: number | '';
  trainingDone: boolean | null;
  weightKg: number | '';
  chestCm: number | '';
  waistCm: number | '';
  hipCm: number | '';
  legCm: number | '';
};

export type ParticipantDayData = {
  streamId: string;
  dayNumber: number;
  currentDayNumber: number;
  isEditable: boolean;
  isFinished: boolean;
  isMeasurementDay: boolean;
  targetCalories: number | null;
  goal: Goal | null;
  profileCompleted: boolean;
  stream: {
    template: {
      title: string;
    };
  };
  day: DayMaterialsData | null;
  report: DayReportData | null;
};

export type { ReportLineItem, PulseFormItem };
