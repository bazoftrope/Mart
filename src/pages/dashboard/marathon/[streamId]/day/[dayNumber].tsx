import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import ProductSearch, { type Product } from '@/components/ProductSearch';
import ReportTable, {
  type ReportLineItem,
  computeLineCalories,
} from '@/components/ReportTable';
import PulseReadingsForm, {
  type PulseFormItem,
  pulseFormItemsToApi,
  apiToPulseFormItems,
} from '@/components/PulseReadingsForm';
import styles from './Day.module.css';

export type PulseReadingItem = {
  id?: string;
  measuredAt: string;
  pulse: number;
};

type DayData = {
  streamId: string;
  dayNumber: number;
  currentDayNumber: number;
  isEditable: boolean;
  day: {
    textContent: string | null;
    audioUrl: string | null;
    videoUrl: string | null;
  } | null;
  report: {
    id: string;
    totalCalories: number;
    filledAt: string;
    updatedAt: string;
    waterLiters: number | null;
    steps: number | null;
    sleepHours: number | null;
    activityMinutes: number | null;
    weightKg: number | null;
    pulseReadings: PulseReadingItem[];
    lines: ReportLineItem[];
  } | null;
};

type MetricsState = {
  waterLiters: number | '';
  steps: number | '';
  sleepHours: number | '';
  activityHours: number | '';
  activityMinutes: number | '';
  weightKg: number | '';
};

function activityToParts(totalMinutes: number | null | undefined): {
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

function emptyMetrics(): MetricsState {
  return {
    waterLiters: '',
    steps: '',
    sleepHours: '',
    activityHours: '',
    activityMinutes: '',
    weightKg: '',
  };
}

function hasAnyData(
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
    metrics.weightKg !== '';
  if (hasMetrics) return true;

  const hasPulse = pulseReadings.some((item) => {
    const pulse =
      typeof item.pulse === 'number' ? item.pulse : Number(item.pulse);
    return item.time !== '' && !Number.isNaN(pulse) && pulse > 0;
  });
  return hasPulse;
}

export default function DayPage() {
  const router = useRouter();
  const { streamId, dayNumber } = router.query;

  const [data, setData] = useState<DayData | null>(null);
  const [lines, setLines] = useState<ReportLineItem[]>([]);
  const [metrics, setMetrics] = useState<MetricsState>(emptyMetrics());
  const [pulseReadings, setPulseReadings] = useState<PulseFormItem[]>([
    { time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }), pulse: '' },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'participant') {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!streamId || !dayNumber) return;

    async function load() {
      try {
        const res = await fetch(
          `/api/streams/${streamId}/day/${dayNumber}`,
          { credentials: 'include' }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить день');
        }
        const loaded: DayData = json.data;
        setData(loaded);
        setLines(loaded.report?.lines || []);

        if (loaded.report) {
          const { hours, minutes } = activityToParts(
            loaded.report.activityMinutes
          );
          setMetrics({
            waterLiters: loaded.report.waterLiters ?? '',
            steps: loaded.report.steps ?? '',
            sleepHours: loaded.report.sleepHours ?? '',
            activityHours: hours,
            activityMinutes: minutes,
            weightKg: loaded.report.weightKg ?? '',
          });
          setPulseReadings(
            loaded.report.pulseReadings?.length
              ? apiToPulseFormItems(loaded.report.pulseReadings)
              : [{ time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }), pulse: '' }]
          );
        } else {
          setMetrics(emptyMetrics());
          setPulseReadings([
            { time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }), pulse: '' },
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [streamId, dayNumber]);

  function updateMetric(field: keyof MetricsState, value: string) {
    setMetrics((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
  }

  function handleAddProduct(product: Product) {
    const exists = lines.some((line) => line.productId === product.id);
    if (exists) {
      setSaveError('Этот продукт уже добавлен в отчёт');
      return;
    }

    const newLine: ReportLineItem = {
      productId: product.id,
      name: product.name,
      calories: product.calories,
      weightGrams: 100,
      lineCalories: computeLineCalories(100, product.calories),
    };
    setLines((prev) => [...prev, newLine]);
    setSaveError(null);
  }

  async function handleSave() {
    if (!data) return;

    if (!hasAnyData(lines, metrics, pulseReadings)) {
      setSaveError('Необходимо заполнить хотя бы одно поле: еду, метрики или замеры пульса');
      return;
    }

    setSaving(true);
    setSaveError(null);

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
      setData((prev) =>
        prev
          ? {
              ...prev,
              report: {
                id: json.data.id,
                totalCalories: json.data.totalCalories,
                filledAt: json.data.filledAt,
                updatedAt: json.data.updatedAt,
                waterLiters: json.data.waterLiters ?? null,
                steps: json.data.steps ?? null,
                sleepHours: json.data.sleepHours ?? null,
                activityMinutes: json.data.activityMinutes ?? null,
                weightKg: json.data.weightKg ?? null,
                pulseReadings: json.data.pulseReadings ?? [],
                lines: json.data.lines,
              },
            }
          : null
      );
      setLines(json.data.lines);
      setMetrics({
        waterLiters: json.data.waterLiters ?? '',
        steps: json.data.steps ?? '',
        sleepHours: json.data.sleepHours ?? '',
        activityHours: hours,
        activityMinutes: minutes,
        weightKg: json.data.weightKg ?? '',
      });
      setPulseReadings(
        json.data.pulseReadings?.length
          ? apiToPulseFormItems(json.data.pulseReadings)
          : [{ time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }), pulse: '' }]
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setSaving(false);
    }
  }

  const canSave = useMemo(
    () => hasAnyData(lines, metrics, pulseReadings),
    [lines, metrics, pulseReadings]
  );

  if (loading) {
    return (
      <main className={styles.main}>
        <p>Загрузка...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className={styles.main}>
        <p className={styles.error}>{error || 'Не удалось загрузить день'}</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Link
        href={`/dashboard/marathon/${streamId}`}
        className={styles.backLink}
      >
        ← Назад к календарю
      </Link>

      <h1 className={styles.title}>День {data.dayNumber}</h1>

      {!data.isEditable && (
        <p className={styles.notice}>
          Этот день ещё недоступен для редактирования.
        </p>
      )}

      {data.day && (
        <section className={styles.daySection}>
          {data.day.textContent && (
            <div className={styles.textContent}>
              {data.day.textContent}
            </div>
          )}
          {data.day.audioUrl && (
            <div className={styles.mediaLink}>
              <strong>Аудио:</strong>{' '}
              <a href={data.day.audioUrl} target="_blank" rel="noopener noreferrer">
                Слушать
              </a>
            </div>
          )}
          {data.day.videoUrl && (
            <div className={styles.mediaLink}>
              <strong>Видео:</strong>{' '}
              <a href={data.day.videoUrl} target="_blank" rel="noopener noreferrer">
                Смотреть
              </a>
            </div>
          )}
        </section>
      )}

      <section className={styles.reportSection}>
        <h2>Отчёт</h2>

        {data.isEditable && (
          <div className={styles.searchDiv}>
            <ProductSearch onSelect={handleAddProduct} disabled={saving} />
          </div>
        )}

        <ReportTable
          lines={lines}
          onChange={setLines}
          readOnly={!data.isEditable}
        />

        <div className={styles.metricsSection}>
          <h3 className={styles.metricsTitle}>Метрики</h3>
          <div className={styles.metricsGrid}>
            <label className={styles.metricField}>
              <span>Вода (л)</span>
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={metrics.waterLiters}
                onChange={(e) => updateMetric('waterLiters', e.target.value)}
                disabled={!data.isEditable || saving}
                className={styles.metricInput}
              />
            </label>

            <label className={styles.metricField}>
              <span>Шаги</span>
              <input
                type="number"
                min="0"
                max="100000"
                step="1"
                value={metrics.steps}
                onChange={(e) => updateMetric('steps', e.target.value)}
                disabled={!data.isEditable || saving}
                className={styles.metricInput}
              />
            </label>

            <label className={styles.metricField}>
              <span>Сон (ч)</span>
              <input
                type="number"
                min="0"
                max="24"
                step="1"
                value={metrics.sleepHours}
                onChange={(e) => updateMetric('sleepHours', e.target.value)}
                disabled={!data.isEditable || saving}
                className={styles.metricInput}
              />
            </label>

            <label className={styles.metricField}>
              <span>Активность</span>
              <div className={styles.activityInputs}>
                <input
                  type="number"
                  min="0"
                  max="23"
                  step="1"
                  value={metrics.activityHours}
                  onChange={(e) => updateMetric('activityHours', e.target.value)}
                  disabled={!data.isEditable || saving}
                  className={styles.metricInput}
                  placeholder="ч"
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  value={metrics.activityMinutes}
                  onChange={(e) => updateMetric('activityMinutes', e.target.value)}
                  disabled={!data.isEditable || saving}
                  className={styles.metricInput}
                  placeholder="мин"
                />
              </div>
            </label>

            <label className={styles.metricField}>
              <span>Вес (кг)</span>
              <input
                type="number"
                min="20"
                max="300"
                step="1"
                value={metrics.weightKg}
                onChange={(e) => updateMetric('weightKg', e.target.value)}
                disabled={!data.isEditable || saving}
                className={styles.metricInput}
              />
            </label>
          </div>
        </div>

        <PulseReadingsForm
          readings={pulseReadings}
          onChange={setPulseReadings}
          readOnly={!data.isEditable}
        />

        {data.isEditable && (
          <div className={styles.saveBtnDiv}>
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className={styles.saveBtn}
            >
              {saving ? 'Сохранение...' : 'Сохранить отчёт'}
            </button>
          </div>
        )}

        {saveError && (
          <p className={styles.saveError}>{saveError}</p>
        )}

        {data.report && (
          <p className={styles.lastUpdated}>
            Последнее обновление: {new Date(data.report.updatedAt).toLocaleString()}
          </p>
        )}
      </section>
    </main>
  );
}
