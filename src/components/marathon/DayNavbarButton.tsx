import { Scale } from 'lucide-react';
import styles from './Marathon.module.css';

type DayNavbarButtonProps = {
  dayNumber: number;
  weekday: string;
  dateLabel: string;
  isAccessible: boolean;
  isActive: boolean;
  isCurrent: boolean;
  isFilled: boolean;
  isCalorieProblem: boolean;
  isMeasurementDay: boolean;
  calories: number | null;
  onSelect: (dayNumber: number) => void;
};

export default function DayNavbarButton({
  dayNumber,
  weekday,
  dateLabel,
  isAccessible,
  isActive,
  isCurrent,
  isFilled,
  isCalorieProblem,
  isMeasurementDay,
  calories,
  onSelect,
}: DayNavbarButtonProps) {
  const className = [
    styles.dayItem,
    isAccessible ? styles.dayAccessible : styles.dayDisabled,
    isActive ? styles.dayActive : '',
    isCurrent ? styles.dayCurrent : '',
    isFilled ? (isCalorieProblem ? styles.dayOverLimit : styles.dayFilled) : '',
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClassName = [
    styles.dayItemBox,
    isCurrent ? styles.dayItemBoxCurrent : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className={styles.dayDate}>{weekday} · {dateLabel}</span>
      <span className={styles.dayNumber}>{dayNumber}</span>
      <span className={styles.dayCaloriesSlot}>
        {isFilled && calories !== null ? (
          <span
            className={`${styles.dayCalories} ${
              isCalorieProblem ? styles.dayCaloriesOver : ''
            }`}
          >
            {calories.toFixed(0)} ккал
          </span>
        ) : null}
      </span>
    </>
  );

  const control = !isAccessible ? (
    <div className={className}>{content}</div>
  ) : (
    <button
      type="button"
      className={className}
      onClick={() => onSelect(dayNumber)}
      aria-current={isActive ? 'true' : undefined}
    >
      {content}
    </button>
  );

  return (
    <div className={wrapperClassName}>
      {isMeasurementDay && (
        <Scale
          className={styles.measurementIcon}
          aria-label="День замера"
        />
      )}
      {control}
    </div>
  );
}
