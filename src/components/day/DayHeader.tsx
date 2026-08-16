import type { ParticipantDayData } from '@/types/participantDay';
import styles from './DayHeader.module.css';

type DayHeaderProps = {
  data: ParticipantDayData;
};

export default function DayHeader({ data }: DayHeaderProps) {
  const isLocked = data.dayNumber > data.currentDayNumber;

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{data.stream.template.title}</h1>
      <p className={styles.subtitle}>День {data.dayNumber}</p>

      {isLocked && (
        <p className={styles.notice}>
          Этот день ещё недоступен для редактирования.
        </p>
      )}
    </header>
  );
}
