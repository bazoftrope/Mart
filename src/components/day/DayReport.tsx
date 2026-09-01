import Link from 'next/link';
import ProductSearch from '@/components/ProductSearch';
import ReportTable from '@/components/ReportTable';
import PulseReadingsForm from '@/components/PulseReadingsForm';
import { useParticipantDayStore } from '@/stores/participantDayStore';
import { hasAnyData } from '@/stores/participantDayStore';
import { GOAL_LABELS } from '@/lib/calorieCalculator';
import styles from './DayReport.module.css';

type DayReportProps = {
  streamId: string;
  dayNumber: number;
  isEditable: boolean;
};

export default function DayReport({ streamId, dayNumber, isEditable }: DayReportProps) {
  const {
    lines,
    metrics,
    pulseReadings,
    saving,
    saveError,
    data,
    addProductLine,
    updateLine,
    removeLine,
    updateMetric,
    addPulseReading,
    updatePulseReading,
    removePulseReading,
    saveReport,
  } = useParticipantDayStore();

  const canSave = hasAnyData(lines, metrics, pulseReadings);

  const actualCalories = lines.reduce((sum, line) => sum + line.lineCalories, 0);
  const targetCalories = data?.targetCalories ?? null;
  const isOverLimit = targetCalories !== null && actualCalories > targetCalories;
  const remainingCalories =
    targetCalories === null ? null : Math.round(targetCalories - actualCalories);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Отчёт</h2>

      {isEditable && (
        <div className={styles.searchDiv}>
          <ProductSearch onSelect={addProductLine} disabled={saving} />
        </div>
      )}

      <div className={styles.reportLayout}>
        <div className={styles.tableWrap}>
          <ReportTable
            lines={lines}
            onUpdateLine={updateLine}
            onRemoveLine={removeLine}
            readOnly={!isEditable}
            headerStatus={
              targetCalories === null
                ? undefined
                : isOverLimit
                  ? 'over'
                  : 'ok'
            }
          />
        </div>

        {targetCalories !== null ? (
          <div
            className={`${styles.calorieSummary} ${
              isOverLimit ? styles.statusOver : styles.statusOk
            }`}
          >
            <div className={styles.calorieSummaryHeader}>
              <span className={styles.calorieStatusIcon}>
                {isOverLimit ? '✕' : '✓'}
              </span>
              <span>
                {isOverLimit
                  ? 'Превышение лимита'
                  : 'Норма / дефицит'}
              </span>
            </div>
            <div className={styles.calorieSummaryValues}>
              <span>
                Цель: <strong>{targetCalories} ккал</strong>
              </span>
              <span>
                Факт: <strong>{Math.round(actualCalories)} ккал</strong>
              </span>
              <span>
                {remainingCalories !== null && remainingCalories >= 0
                  ? `Остаток: ${remainingCalories} ккал`
                  : `Превышение: ${remainingCalories === null ? 0 : Math.abs(remainingCalories)} ккал`}
              </span>
            </div>
            {data?.goal && (
              <div className={styles.calorieGoal}>Цель потока: {GOAL_LABELS[data.goal]}</div>
            )}
          </div>
        ) : targetCalories === null && !data?.profileCompleted ? (
          <div className={styles.calorieSummary}>
            <p>
              Для расчёта дневной нормы заполните анкету участника:{' '}
              <Link href="/onboarding">перейти к анкете</Link>
            </p>
          </div>
        ) : null}
      </div>

      <div className={styles.metricsSection}>
        <h3 className={styles.metricsTitle}>Метрики</h3>
        <div className={styles.metricsRow}>
          <div className={styles.metricsBlock}>
            <h4 className={styles.metricsBlockTitle}>Вес и охваты</h4>
            <div className={styles.metricsBlockFields}>
              <label className={styles.metricField}>
                <span>Вес (кг)</span>
                <input
                  type="number"
                  min="20"
                  max="300"
                  step="1"
                  value={metrics.weightKg}
                  onChange={(e) => updateMetric('weightKg', e.target.value)}
                  disabled={!isEditable || saving}
                  className={styles.metricInput}
                />
              </label>

              <label className={styles.metricField}>
                <span>ОГ — грудь (см)</span>
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="0.5"
                  value={metrics.chestCm}
                  onChange={(e) => updateMetric('chestCm', e.target.value)}
                  disabled={!isEditable || saving}
                  className={styles.metricInput}
                />
              </label>

              <label className={styles.metricField}>
                <span>ОТ — талия (см)</span>
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="0.5"
                  value={metrics.waistCm}
                  onChange={(e) => updateMetric('waistCm', e.target.value)}
                  disabled={!isEditable || saving}
                  className={styles.metricInput}
                />
              </label>

              <label className={styles.metricField}>
                <span>ОБ — бёдра (см)</span>
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="0.5"
                  value={metrics.hipCm}
                  onChange={(e) => updateMetric('hipCm', e.target.value)}
                  disabled={!isEditable || saving}
                  className={styles.metricInput}
                />
              </label>

              <label className={styles.metricField}>
                <span>ОН — нога (см)</span>
                <input
                  type="number"
                  min="20"
                  max="200"
                  step="0.5"
                  value={metrics.legCm}
                  onChange={(e) => updateMetric('legCm', e.target.value)}
                  disabled={!isEditable || saving}
                  className={styles.metricInput}
                />
              </label>
            </div>
          </div>

          <div className={styles.metricsBlock}>
            <h4 className={styles.metricsBlockTitle}>Вода, шаги, сон, активность</h4>
            <div className={styles.metricsBlockFields}>
              <label className={styles.metricField}>
                <span>Вода (л)</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={metrics.waterLiters}
                  onChange={(e) => updateMetric('waterLiters', e.target.value)}
                  disabled={!isEditable || saving}
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
                  disabled={!isEditable || saving}
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
                  disabled={!isEditable || saving}
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
                    disabled={!isEditable || saving}
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
                    disabled={!isEditable || saving}
                    className={styles.metricInput}
                    placeholder="мин"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className={styles.metricsBlock}>
            <PulseReadingsForm
              className={styles.pulseBlockContent}
              readings={pulseReadings}
              onUpdateReading={updatePulseReading}
              onAddReading={addPulseReading}
              onRemoveReading={removePulseReading}
              readOnly={!isEditable}
            />
          </div>
        </div>
      </div>

      {isEditable && (
        <div className={styles.saveBtnDiv}>
          <button
            onClick={() => saveReport(streamId, dayNumber)}
            disabled={saving || !canSave}
            className={styles.saveBtn}
          >
            {saving ? 'Сохранение...' : 'Сохранить отчёт'}
          </button>
        </div>
      )}

      {saveError && <p className={styles.saveError}>{saveError}</p>}

      {data?.report && (
        <p className={styles.lastUpdated}>
          Последнее обновление: {new Date(data.report.updatedAt).toLocaleString()}
        </p>
      )}
    </section>
  );
}
