import Link from 'next/link';
import MarathonChatPopup from '@/components/Chat/MarathonChatPopup';
import type { MarathonRating, MarathonStream } from './MarathonWindow';
import styles from './Marathon.module.css';

type MarathonHeaderProps = {
  stream: MarathonStream;
  rating: MarathonRating;
};

export default function MarathonHeader({
  stream,
  rating,
}: MarathonHeaderProps) {
  const ratingLine =
    rating && rating.rank !== null && rating.totalParticipants > 0
      ? `Вы: ${rating.rank} из ${rating.totalParticipants} · ${
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

      {/*<div className={styles.titleRow}>
        <h1 className={styles.title}>{stream.template.title}</h1>
        <MarathonChatPopup streamId={stream.id} />
      </div>*/}


      {ratingLine && <div className={styles.ratingLine}>
        <h2 className={styles.title}>{stream.template.title}</h2>
        {ratingLine}
        <MarathonChatPopup streamId={stream.id} />
      </div>}


    </header>
  );
}
