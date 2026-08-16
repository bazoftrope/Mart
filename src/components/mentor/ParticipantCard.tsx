import Link from 'next/link';
import styles from './ParticipantCard.module.css';

export type Participant = {
  id: string;
  name: string;
  email: string;
};

export type ParticipantRating = {
  rank: number | null;
  weightLossPercent: number;
  entryWeight: number | null;
  currentWeight: number | null;
};

type ParticipantCardProps = {
  streamId: string;
  enrolledAt: string;
  participant: Participant | null;
  rating: ParticipantRating | null;
};

export default function ParticipantCard({
  streamId,
  enrolledAt,
  participant,
  rating,
}: ParticipantCardProps) {
  const ratingLine =
    rating && rating.rank !== null
      ? `Место: ${rating.rank} · ${
          rating.weightLossPercent > 0
            ? `−${rating.weightLossPercent}%`
            : `${rating.weightLossPercent}%`
        }`
      : null;

  return (
    <li className={styles.listItem}>
      <p className={styles.info}>
        <strong>Имя:</strong> {participant?.name || 'Неизвестно'}
      </p>
      <p className={styles.info}>
        <strong>Email:</strong> {participant?.email || 'Неизвестно'}
      </p>
      {ratingLine && <p className={styles.rating}>{ratingLine}</p>}
      <p className={styles.info}>
        <strong>Записан:</strong> {new Date(enrolledAt).toLocaleString()}
      </p>
      {participant && (
        <Link
          href={`/mentor/streams/${streamId}/participants/${participant.id}`}
          className={styles.reportLink}
        >
          Отчёт →
        </Link>
      )}
    </li>
  );
}
