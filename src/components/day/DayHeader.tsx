import type { ParticipantDayData } from '@/types/participantDay';
import styles from './DayHeader.module.css';

type DayHeaderProps = {
  data: ParticipantDayData;
};

export default function DayHeader({ data }: DayHeaderProps) {
  const isLocked = data.dayNumber > data.currentDayNumber;

  return (
    <header className={styles.header}>

      {isLocked && (
        <p className={styles.notice}>
          Этот день ещё недоступен для редактирования.
        </p>
      )}
    </header>
  );
}
