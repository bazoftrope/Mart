import Link from 'next/link';
import styles from './StreamCard.module.css';

type StreamCardProps = {
  title: string;
  href?: string;
  resultsHref?: string;
  description?: string;
  startDate?: string;
  durationDays?: number;
  mentorName?: string;
  participantsCount?: number;
  status?: string;
  enrolledAt?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Набор',
  running: 'Идёт',
  finished: 'Завершён',
};

export default function StreamCard({
  title,
  href,
  resultsHref,
  description,
  startDate,
  durationDays,
  mentorName,
  participantsCount,
  status,
  enrolledAt,
  ctaHref,
  ctaLabel,
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
        {status && (
          <span className={styles.status}>
            {STATUS_LABELS[status] || status}
          </span>
        )}
      </header>

      {description && <p className={styles.description}>{description}</p>}

      {resultsHref && (
        <Link href={resultsHref} className={styles.resultsLink}>
          Результаты
        </Link>
      )}

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
        {participantsCount != null && (
          <div className={styles.metaItem}>
            <span className={styles.label}>Участников</span>
            <span>{participantsCount}</span>
          </div>
        )}
        {enrolledAt && (
          <div className={styles.metaItem}>
            <span className={styles.label}>Записан</span>
            <span>{new Date(enrolledAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className={styles.cardCta}>
          {ctaLabel}
        </Link>
      )}
    </li>
  );
}
