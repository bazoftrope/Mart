import Link from 'next/link';
import styles from './CalendarGrid.module.css';

type CalendarDay = {
  dayNumber: number;
  totalCalories?: number;
  filled?: boolean;
};

type CalendarGridProps = {
  streamId: string;
  durationDays: number;
  currentDayNumber: number;
  reports?: Array<{ dayNumber: number; totalCalories: number }>;
};

export default function CalendarGrid({
  streamId,
  durationDays,
  currentDayNumber,
  reports = [],
}: CalendarGridProps) {
  const reportMap = new Map(reports.map((r) => [r.dayNumber, r.totalCalories]));
  const days: CalendarDay[] = Array.from({ length: durationDays }, (_, i) => {
    const dayNumber = i + 1;
    return {
      dayNumber,
      filled: reportMap.has(dayNumber),
      totalCalories: reportMap.get(dayNumber),
    };
  });

  return (
    <div className={styles.grid}>
      {days.map((day) => {
        const isAccessible = day.dayNumber <= currentDayNumber;
        const dayClass = [
          styles.day,
          isAccessible ? styles.dayAccessible : styles.dayDisabled,
          day.filled ? styles.dayFilled : '',
        ]
          .filter(Boolean)
          .join(' ');

        const content = (
          <>
            <span className={styles.dayNumber}>{day.dayNumber}</span>
            {day.filled && (
              <span className={styles.dayCalories}>
                {day.totalCalories?.toFixed(0)} ккал
              </span>
            )}
          </>
        );

        if (isAccessible) {
          return (
            <Link
              key={day.dayNumber}
              href={`/dashboard/marathon/${streamId}/day/${day.dayNumber}`}
              className={dayClass}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={day.dayNumber} className={dayClass}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
