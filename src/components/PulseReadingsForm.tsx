import { useCallback } from 'react';
import styles from './PulseReadingsForm.module.css';

export type PulseFormItem = {
  id?: string;
  time: string;
  pulse: number | '';
};

type PulseReadingsFormProps = {
  readings: PulseFormItem[];
  onChange: (readings: PulseFormItem[]) => void;
  readOnly?: boolean;
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
): { measuredAt: string; pulse: number }[] {
  const today = new Date().toISOString().split('T')[0];
  return items
    .filter((item): item is PulseFormItem & { pulse: number } => {
      const pulse = typeof item.pulse === 'number' ? item.pulse : Number(item.pulse);
      return item.time !== '' && !Number.isNaN(pulse) && pulse > 0;
    })
    .map((item) => ({
      measuredAt: new Date(`${today}T${item.time}`).toISOString(),
      pulse: item.pulse,
    }));
}

export function apiToPulseFormItems(
  readings: { id?: string; measuredAt: string | Date; pulse: number }[]
): PulseFormItem[] {
  return readings.map((reading) => ({
    id: reading.id,
    time: isoToTime(reading.measuredAt),
    pulse: reading.pulse,
  }));
}

export default function PulseReadingsForm({
  readings,
  onChange,
  readOnly,
}: PulseReadingsFormProps) {
  const updateItem = useCallback(
    (index: number, patch: Partial<PulseFormItem>) => {
      const next = readings.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      );
      onChange(next);
    },
    [readings, onChange]
  );

  const addReading = useCallback(() => {
    onChange([...readings, { time: getCurrentTime(), pulse: '' }]);
  }, [readings, onChange]);

  const removeReading = useCallback(
    (index: number) => {
      onChange(readings.filter((_, i) => i !== index));
    },
    [readings, onChange]
  );

  return (
    <div className={styles.section}>
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
