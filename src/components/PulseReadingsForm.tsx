import { useCallback } from 'react';
import styles from './PulseReadingsForm.module.css';

export type PulseFormItem = {
  id?: string;
  time: string;
  pulse: number | '';
  systolic: number | '';
  diastolic: number | '';
};

type PulseReadingsFormProps = {
  readings: PulseFormItem[];
  onChange?: (readings: PulseFormItem[]) => void;
  onUpdateReading?: (index: number, patch: Partial<PulseFormItem>) => void;
  onAddReading?: () => void;
  onRemoveReading?: (index: number) => void;
  readOnly?: boolean;
  className?: string;
};

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function isoToTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return getCurrentTime();
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function pulseFormItemsToApi(
  items: PulseFormItem[]
): { measuredAt: string; pulse: number; systolic?: number; diastolic?: number }[] {
  const today = new Date().toISOString().split('T')[0];
  return items
    .filter((item): item is PulseFormItem & { pulse: number } => {
      const pulse = typeof item.pulse === 'number' ? item.pulse : Number(item.pulse);
      return item.time !== '' && !Number.isNaN(pulse) && pulse > 0;
    })
    .map((item) => {
      const systolic =
        item.systolic === '' ? undefined : Number(item.systolic);
      const diastolic =
        item.diastolic === '' ? undefined : Number(item.diastolic);
      return {
        measuredAt: new Date(`${today}T${item.time}`).toISOString(),
        pulse: item.pulse,
        ...(systolic !== undefined && !Number.isNaN(systolic)
          ? { systolic }
          : {}),
        ...(diastolic !== undefined && !Number.isNaN(diastolic)
          ? { diastolic }
          : {}),
      };
    });
}

export function apiToPulseFormItems(
  readings: {
    id?: string;
    measuredAt: string | Date;
    pulse: number;
    systolic?: number | null;
    diastolic?: number | null;
  }[]
): PulseFormItem[] {
  return readings.map((reading) => ({
    id: reading.id,
    time: isoToTime(reading.measuredAt),
    pulse: reading.pulse,
    systolic: reading.systolic ?? '',
    diastolic: reading.diastolic ?? '',
  }));
}

export default function PulseReadingsForm({
  readings,
  onChange,
  onUpdateReading,
  onAddReading,
  onRemoveReading,
  readOnly,
  className,
}: PulseReadingsFormProps) {
  const updateItem = useCallback(
    (index: number, patch: Partial<PulseFormItem>) => {
      if (onUpdateReading) {
        onUpdateReading(index, patch);
        return;
      }
      const next = readings.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      );
      onChange?.(next);
    },
    [readings, onChange, onUpdateReading]
  );

  const addReading = useCallback(() => {
    if (onAddReading) {
      onAddReading();
      return;
    }
    onChange?.([...readings, { time: getCurrentTime(), pulse: '', systolic: '', diastolic: '' }]);
  }, [readings, onChange, onAddReading]);

  const removeReading = useCallback(
    (index: number) => {
      if (onRemoveReading) {
        onRemoveReading(index);
        return;
      }
      onChange?.(readings.filter((_, i) => i !== index));
    },
    [readings, onChange, onRemoveReading]
  );

  return (
    <div className={`${styles.section} ${className ?? ''}`}>
      <h3 className={styles.title}>Замеры пульса</h3>

      {readings.length === 0 ? (
        <p className={styles.emptyText}>Замеров пока нет.</p>
      ) : (
        readings.map((item, index) => (
          <div key={item.id || index} className={styles.row}>
            <input
              type="time"
              value={item.time}
              onChange={(e) => updateItem(index, { time: e.target.value })}
              disabled={readOnly}
              className={styles.timeInput}
            />
            <input
              type="number"
              min="30"
              max="250"
              step="1"
              value={item.pulse}
              onChange={(e) => {
                const value = e.target.value;
                updateItem(index, {
                  pulse: value === '' ? '' : Number(value),
                });
              }}
              disabled={readOnly}
              placeholder="пульс"
              className={styles.pulseInput}
            />
            <input
              type="number"
              min="60"
              max="250"
              step="1"
              value={item.systolic}
              onChange={(e) => {
                const value = e.target.value;
                updateItem(index, {
                  systolic: value === '' ? '' : Number(value),
                });
              }}
              disabled={readOnly}
              placeholder="сист."
              className={styles.pressureInput}
            />
            <input
              type="number"
              min="40"
              max="160"
              step="1"
              value={item.diastolic}
              onChange={(e) => {
                const value = e.target.value;
                updateItem(index, {
                  diastolic: value === '' ? '' : Number(value),
                });
              }}
              disabled={readOnly}
              placeholder="диаст."
              className={styles.pressureInput}
            />
            {!readOnly && readings.length > 1 && (
              <button
                type="button"
                onClick={() => removeReading(index)}
                className={styles.removeButton}
              >
                Удалить
              </button>
            )}
          </div>
        ))
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={addReading}
          className={styles.addButton}
        >
          + добавить замер
        </button>
      )}
    </div>
  );
}
