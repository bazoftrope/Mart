import Link from 'next/link';
import styles from './ParticipantCard.module.css';

export type Participant = {
  id: string;
  name: string;
  email: string;
};

type ParticipantCardProps = {
  streamId: string;
  enrolledAt: string;
  participant: Participant | null;
};

export default function ParticipantCard({
  streamId,
  enrolledAt,
  participant,
}: ParticipantCardProps) {
  return (
    <li className={styles.listItem}>
      <p className={styles.info}>
        <strong>Имя:</strong> {participant?.name || 'Неизвестно'}
      </p>
      <p className={styles.info}>
        <strong>Email:</strong> {participant?.email || 'Неизвестно'}
      </p>
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
