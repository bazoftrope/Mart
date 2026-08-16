import Link from 'next/link';
import type { MarathonRating, MarathonStream } from './MarathonWindow';
import styles from './Marathon.module.css';

type MarathonHeaderProps = {
  stream: MarathonStream;
  currentDayNumber: number;
  rating: MarathonRating;
};

export default function MarathonHeader({
  stream,
  currentDayNumber,
  rating,
}: MarathonHeaderProps) {
  const ratingLine =
    rating && rating.rank !== null && rating.totalParticipants > 0
      ? `Твоё место: ${rating.rank} из ${rating.totalParticipants} · ${
          rating.weightLossPercent > 0
            ? `−${rating.weightLossPercent}%`
            : `${rating.weightLossPercent}%`
        }`
      : null;

  return (
    <header className={styles.header}>
      <Link href="/dashboard" className={styles.backLink}>
        ← Назад к моим марафонам
      </Link>

      <h1 className={styles.title}>{stream.template.title}</h1>
      <p className={styles.description}>
        {stream.template.description || 'Нет описания'}
      </p>

      {ratingLine && <div className={styles.ratingLine}>{ratingLine}</div>}

      <div className={styles.infoBlock}>
        <p>
          <strong>Длительность:</strong> {stream.template.durationDays} дн.
        </p>
        <p>
          <strong>Дата начала:</strong>{' '}
          {new Date(stream.startDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Статус:</strong> {stream.status}
        </p>
        <p>
          <strong>Текущий день:</strong>{' '}
          {currentDayNumber > 0 ? currentDayNumber : 'Ещё не начат'}
        </p>
      </div>

      <div className={styles.actions}>
        <Link href={`/dashboard/messages?streamId=${stream.id}&group=1`}>
          <button className={styles.chatBtn}>Общий чат потока</button>
        </Link>
        <Link href={`/dashboard/messages?streamId=${stream.id}`}>
          <button className={styles.chatBtn}>Написать ментору</button>
        </Link>
      </div>
    </header>
  );
}