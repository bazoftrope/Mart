import Link from 'next/link';
import styles from './StreamCard.module.css';

type StreamCardProps = {
  title: string;
  href?: string;
  description?: string;
  startDate?: string;
  durationDays?: number;
  mentorName?: string;
  status?: string;
  enrolledAt?: string;
};

export default function StreamCard({
  title,
  href,
  description,
  startDate,
  durationDays,
  mentorName,
  status,
  enrolledAt,
}: StreamCardProps) {
  const titleEl = href ? (
    <Link href={href} className={styles.cardLink}>
      <h3 className={styles.cardTitle}>{title}</h3>
    </Link>
  ) : (
    <h3 className={styles.cardTitle}>{title}</h3>
  );

  return (
    <li className={styles.card}>
      <header className={styles.header}>
        {titleEl}
        {status && <span className={styles.status}>{status}</span>}
      </header>

      {description && <p className={styles.description}>{description}</p>}

      <div className={styles.metaGrid}>
        {durationDays != null && (
          <div className={styles.metaItem}>
            <span className={styles.label}>Длительность</span>
            <span>{durationDays} дн.</span>
          </div>
        )}
        {startDate && (
          <div className={styles.metaItem}>
            <span className={styles.label}>Начало: {new Date(startDate).toLocaleDateString()}</span>
          </div>
        )}
        {mentorName && (
          <div className={styles.metaItem}>
            <span className={styles.label}>Ментор: {mentorName}</span>
          </div>
        )}
        {enrolledAt && (
          <div className={styles.metaItem}>
            <span className={styles.label}>Записан</span>
            <span>{new Date(enrolledAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </li>
  );
}
