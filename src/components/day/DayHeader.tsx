import Link from 'next/link';
import type { ParticipantDayData } from '@/types/participantDay';
import styles from './DayHeader.module.css';

type DayHeaderProps = {
  streamId: string;
  data: ParticipantDayData;
};

export default function DayHeader({ streamId, data }: DayHeaderProps) {
  const isLocked = data.dayNumber > data.currentDayNumber;

  return (
    <header className={styles.header}>
      <Link
        href={`/dashboard/marathon/${streamId}`}
        className={styles.backLink}
      >
        ← Назад к календарю
      </Link>

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
