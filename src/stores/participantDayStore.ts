import { create } from 'zustand';
import type { Product } from '@/components/ProductSearch';
import {
  computeLineCalories,
  type ReportLineItem,
} from '@/components/ReportTable';
import {
  apiToPulseFormItems,
  pulseFormItemsToApi,
  type PulseFormItem,
} from '@/components/PulseReadingsForm';
import type {
  MetricsState,
  ParticipantDayData,
} from '@/types/participantDay';

interface ParticipantDayState {
  data: ParticipantDayData | null;
  daysCache: Record<string, Record<number, ParticipantDayData>>;
  lines: ReportLineItem[];
  metrics: MetricsState;
  pulseReadings: PulseFormItem[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
}

interface ParticipantDayActions {
  loadAllDays: (streamId: string) => Promise<void>;
  selectDay: (day: ParticipantDayData) => void;
  saveReport: (streamId: string, dayNumber: number) => Promise<void>;
  addProductLine: (product: Product) => void;
  updateLine: (index: number, weightGrams: number) => void;
  removeLine: (index: number) => void;
  updateMetric: (field: keyof MetricsState, value: string) => void;
  addPulseReading: () => void;
  updatePulseReading: (index: number, patch: Partial<PulseFormItem>) => void;
  removePulseReading: (index: number) => void;
  resetState: () => void;
}

type ParticipantDayStore = ParticipantDayState & ParticipantDayActions;

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function emptyMetrics(): MetricsState {
  return {
    waterLiters: '',
    steps: '',
    sleepHours: '',
    activityHours: '',
    activityMinutes: '',
    weightKg: '',
    chestCm: '',
    waistCm: '',
    hipCm: '',
    legCm: '',
  };
}

export function activityToParts(totalMinutes: number | null | undefined): {
  hours: number | '';
  minutes: number | '';
} {
  if (totalMinutes === null || totalMinutes === undefined) {
    return { hours: '', minutes: '' };
  }
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export function hasAnyData(
  lines: ReportLineItem[],
  metrics: MetricsState,
  pulseReadings: PulseFormItem[]
): boolean {
  if (lines.length > 0) return true;

  const hasMetrics =
    metrics.waterLiters !== '' ||
    metrics.steps !== '' ||
    metrics.sleepHours !== '' ||
    metrics.activityHours !== '' ||
    metrics.activityMinutes !== '' ||
    metrics.weightKg !== '' ||
    metrics.chestCm !== '' ||
    metrics.waistCm !== '' ||
    metrics.hipCm !== '' ||
    metrics.legCm !== '';
  if (hasMetrics) return true;

  const hasPulse = pulseReadings.some((item) => {
    const pulse =
      typeof item.pulse === 'number' ? item.pulse : Number(item.pulse);
    return item.time !== '' && !Number.isNaN(pulse) && pulse > 0;
  });
  return hasPulse;
}

function buildInitialPulseReadings(
  report: ParticipantDayData['report']
): PulseFormItem[] {
  if (report?.pulseReadings?.length) {
    return apiToPulseFormItems(report.pulseReadings);
  }
  return [{ time: getCurrentTime(), pulse: '' }];
}

function buildInitialMetrics(
  report: ParticipantDayData['report']
): MetricsState {
  if (!report) return emptyMetrics();

  const { hours, minutes } = activityToParts(report.activityMinutes);
  return {
    waterLiters: report.waterLiters ?? '',
    steps: report.steps ?? '',
    sleepHours: report.sleepHours ?? '',
    activityHours: hours,
    activityMinutes: minutes,
    weightKg: report.weightKg ?? '',
    chestCm: report.chestCm ?? '',
    waistCm: report.waistCm ?? '',
    hipCm: report.hipCm ?? '',
    legCm: report.legCm ?? '',
  };
}

const initialState: ParticipantDayState = {
  data: null,
  daysCache: {},
  lines: [],
  metrics: emptyMetrics(),
  pulseReadings: [{ time: getCurrentTime(), pulse: '' }],
  loading: true,
  saving: false,
  error: null,
  saveError: null,
};

function applyDay(day: ParticipantDayData) {
  return {
    data: day,
    lines: day.report?.lines || [],
    metrics: buildInitialMetrics(day.report),
    pulseReadings: buildInitialPulseReadings(day.report),
    loading: false,
    error: null,
  };
}

export const useParticipantDayStore = create<ParticipantDayStore>((set, get) => ({
  ...initialState,

  resetState: () =>
    set((state) => ({ ...initialState, daysCache: state.daysCache })),

  loadAllDays: async (streamId) => {
    if (get().daysCache[streamId]) {
      set({ loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      const res = await fetch(`/api/streams/${streamId}/days`, {
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось загрузить дни');
      }

      const days: ParticipantDayData[] = json.data?.days || [];
      const byDay: Record<number, ParticipantDayData> = {};
      for (const day of days) {
        byDay[day.dayNumber] = day;
      }

      set((state) => ({
        daysCache: { ...state.daysCache, [streamId]: byDay },
        loading: false,
        error: null,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Что-то пошло не так',
        loading: false,
      });
    }
  },

  selectDay: (day) => {
    if (!get().daysCache[day.streamId]?.[day.dayNumber]) {
      return;
    }
    set(applyDay(day));
  },

  saveReport: async (streamId, dayNumber) => {
    const { data, lines, metrics, pulseReadings } = get();
    if (!data) return;

    if (!hasAnyData(lines, metrics, pulseReadings)) {
      set({
        saveError:
          'Необходимо заполнить хотя бы одно поле: еду, метрики или замеры пульса',
      });
      return;
    }

    set({ saving: true, saveError: null });

    const activityHours =
      metrics.activityHours === '' ? 0 : Number(metrics.activityHours);
    const activityMinutes =
      metrics.activityMinutes === '' ? 0 : Number(metrics.activityMinutes);
    const totalActivityMinutes =
      activityHours > 0 || activityMinutes > 0
        ? activityHours * 60 + activityMinutes
        : undefined;

    const payload = {
      lines: lines.map((line) => ({
        productId: line.productId,
        weightGrams: line.weightGrams,
      })),
      waterLiters:
        metrics.waterLiters === '' ? undefined : Number(metrics.waterLiters),
      steps: metrics.steps === '' ? undefined : Number(metrics.steps),
      sleepHours:
        metrics.sleepHours === '' ? undefined : Number(metrics.sleepHours),
      activityMinutes: totalActivityMinutes,
      weightKg: metrics.weightKg === '' ? undefined : Number(metrics.weightKg),
      chestCm: metrics.chestCm === '' ? undefined : Number(metrics.chestCm),
      waistCm: metrics.waistCm === '' ? undefined : Number(metrics.waistCm),
      hipCm: metrics.hipCm === '' ? undefined : Number(metrics.hipCm),
      legCm: metrics.legCm === '' ? undefined : Number(metrics.legCm),
      pulseReadings: pulseFormItemsToApi(pulseReadings),
    };

    try {
      const url = data.report
        ? `/api/reports/${data.report.id}`
        : `/api/streams/${streamId}/day/${dayNumber}`;
      const method = data.report ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось сохранить отчёт');
      }

      const { hours, minutes } = activityToParts(json.data.activityMinutes);
      const updatedReport = {
        id: json.data.id,
        totalCalories: json.data.totalCalories,
        filledAt: json.data.filledAt,
        updatedAt: json.data.updatedAt,
        waterLiters: json.data.waterLiters ?? null,
        steps: json.data.steps ?? null,
        sleepHours: json.data.sleepHours ?? null,
        activityMinutes: json.data.activityMinutes ?? null,
        weightKg: json.data.weightKg ?? null,
        chestCm: json.data.chestCm ?? null,
        waistCm: json.data.waistCm ?? null,
        hipCm: json.data.hipCm ?? null,
        legCm: json.data.legCm ?? null,
        pulseReadings: json.data.pulseReadings ?? [],
        lines: json.data.lines,
      };

      const updatedData: ParticipantDayData = {
        ...data,
        report: updatedReport,
      };

      set((state) => ({
        data: updatedData,
        daysCache: {
          ...state.daysCache,
          [data.streamId]: {
            ...state.daysCache[data.streamId],
            [data.dayNumber]: updatedData,
          },
        },
        lines: json.data.lines,
        metrics: {
          waterLiters: json.data.waterLiters ?? '',
          steps: json.data.steps ?? '',
          sleepHours: json.data.sleepHours ?? '',
          activityHours: hours,
          activityMinutes: minutes,
          weightKg: json.data.weightKg ?? '',
          chestCm: json.data.chestCm ?? '',
          waistCm: json.data.waistCm ?? '',
          hipCm: json.data.hipCm ?? '',
          legCm: json.data.legCm ?? '',
        },
        pulseReadings:
          json.data.pulseReadings?.length
            ? apiToPulseFormItems(json.data.pulseReadings)
            : [{ time: getCurrentTime(), pulse: '' }],
        saving: false,
        saveError: null,
      }));
    } catch (err) {
      set({
        saveError: err instanceof Error ? err.message : 'Что-то пошло не так',
        saving: false,
      });
    }
  },

  addProductLine: (product) => {
    const { lines } = get();
    const exists = lines.some((line) => line.productId === product.id);
    if (exists) {
      set({ saveError: 'Этот продукт уже добавлен в отчёт' });
      return;
    }

    const newLine: ReportLineItem = {
      productId: product.id,
      name: product.name,
      calories: product.calories,
      weightGrams: 100,
      lineCalories: computeLineCalories(100, product.calories),
    };
    set({
      lines: [...lines, newLine],
      saveError: null,
    });
  },

  updateLine: (index, weightGrams) => {
    const { lines } = get();
    const next = lines.map((line, i) => {
      if (i !== index) return line;
      return {
        ...line,
        weightGrams,
        lineCalories: computeLineCalories(weightGrams, line.calories),
      };
    });
    set({ lines: next });
  },

  removeLine: (index) => {
    const { lines } = get();
    set({ lines: lines.filter((_, i) => i !== index) });
  },

  updateMetric: (field, value) => {
    set((state) => ({
      metrics: {
        ...state.metrics,
        [field]: value === '' ? '' : Number(value),
      },
    }));
  },

  addPulseReading: () => {
    set((state) => ({
      pulseReadings: [...state.pulseReadings, { time: getCurrentTime(), pulse: '' }],
    }));
  },

  updatePulseReading: (index, patch) => {
    set((state) => ({
      pulseReadings: state.pulseReadings.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  },

  removePulseReading: (index) => {
    set((state) => ({
      pulseReadings: state.pulseReadings.filter((_, i) => i !== index),
    }));
  },
}));
