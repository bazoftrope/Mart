import styles from './Marathon.module.css';

type DayNavbarReport = { dayNumber: number; totalCalories: number };

type DayNavbarProps = {
  durationDays: number;
  currentDayNumber: number;
  reports: DayNavbarReport[];
  activeDay: number | null;
  onDayChange: (dayNumber: number) => void;
};

export default function DayNavbar({
  durationDays,
  currentDayNumber,
  reports,
  activeDay,
  onDayChange,
}: DayNavbarProps) {
  const reportMap = new Map(reports.map((r) => [r.dayNumber, r.totalCalories]));

  return (
    <nav className={styles.dayNavbar} aria-label="Дни марафона">
      {Array.from({ length: durationDays }, (_, i) => {
        const dayNumber = i + 1;
        const isAccessible = dayNumber <= currentDayNumber;
        const isActive = dayNumber === activeDay;
        const isFilled = reportMap.has(dayNumber);

        const className = [
          styles.dayItem,
          isAccessible ? styles.dayAccessible : styles.dayDisabled,
          isActive ? styles.dayActive : '',
          isFilled ? styles.dayFilled : '',
        ]
          .filter(Boolean)
          .join(' ');

        const content = (
          <>
            <span className={styles.dayNumber}>{dayNumber}</span>
            {isFilled && (
              <span className={styles.dayCalories}>
                {reportMap.get(dayNumber)?.toFixed(0)} ккал
              </span>
            )}
          </>
        );

        if (!isAccessible) {
          return (
            <div key={dayNumber} className={className}>
              {content}
            </div>
          );
        }

        return (
          <button
            key={dayNumber}
            type="button"
            className={className}
            onClick={() => onDayChange(dayNumber)}
            aria-current={isActive ? 'true' : undefined}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}