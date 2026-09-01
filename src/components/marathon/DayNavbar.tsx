import DayNavbarButton from './DayNavbarButton';
import styles from './Marathon.module.css';

type DayNavbarReport = { dayNumber: number; totalCalories: number };

type DayNavbarProps = {
  durationDays: number;
  currentDayNumber: number;
  targetCalories: number | null;
  reports: DayNavbarReport[];
  activeDay: number | null;
  onDayChange: (dayNumber: number) => void;
};

export default function DayNavbar({
  durationDays,
  currentDayNumber,
  targetCalories,
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
        const isCurrent = dayNumber === currentDayNumber;
        const calories = reportMap.get(dayNumber);
        const isFilled = calories !== undefined;
        const isOverLimit =
          targetCalories !== null &&
          calories !== undefined &&
          calories > targetCalories;

        return (
          <DayNavbarButton
            key={dayNumber}
            dayNumber={dayNumber}
            isAccessible={isAccessible}
            isActive={isActive}
            isCurrent={isCurrent}
            isFilled={isFilled}
            isOverLimit={isOverLimit}
            calories={calories ?? null}
            onSelect={onDayChange}
          />
        );
      })}
    </nav>
  );
}
