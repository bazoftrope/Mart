import styles from './Marathon.module.css';

type DayNavbarButtonProps = {
  dayNumber: number;
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
      <span className={styles.dayNumber}>{dayNumber}</span>
      {isFilled && calories !== null && (
        <span
          className={`${styles.dayCalories} ${
            isOverLimit ? styles.dayCaloriesOver : ''
          }`}
        >
          {calories.toFixed(0)} ккал
        </span>
      )}
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
