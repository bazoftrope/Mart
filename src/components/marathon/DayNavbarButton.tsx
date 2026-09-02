import styles from './Marathon.module.css';

type DayNavbarButtonProps = {
  dayNumber: number;
  weekday: string;
  dateLabel: string;
  isAccessible: boolean;
  isActive: boolean;
  isCurrent: boolean;
  isFilled: boolean;
  isOverLimit: boolean;
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
  isOverLimit,
  calories,
  onSelect,
}: DayNavbarButtonProps) {
  const className = [
    styles.dayItem,
    isAccessible ? styles.dayAccessible : styles.dayDisabled,
    isActive ? styles.dayActive : '',
    isCurrent ? styles.dayCurrent : '',
    isFilled ? (isOverLimit ? styles.dayOverLimit : styles.dayFilled) : '',
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
              isOverLimit ? styles.dayCaloriesOver : ''
            }`}
          >
            {calories.toFixed(0)} ккал
          </span>
        ) : null}
      </span>
    </>
  );

  if (!isAccessible) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect(dayNumber)}
      aria-current={isActive ? 'true' : undefined}
    >
      {content}
    </button>
  );
}
