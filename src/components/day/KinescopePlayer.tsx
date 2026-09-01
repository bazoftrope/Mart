import { buildEmbedUrl } from '@/lib/kinescope';
import styles from './KinescopePlayer.module.css';

type KinescopePlayerProps = {
  videoId: string;
  title?: string;
  className?: string;
};

export default function KinescopePlayer({
  videoId,
  title = 'Видеоурок',
  className,
}: KinescopePlayerProps) {
  if (!videoId) {
    return null;
  }

  return (
    <div className={className ? `${styles.container} ${className}` : styles.container}>
      <iframe
        className={styles.iframe}
        src={buildEmbedUrl(videoId)}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;"
        allowFullScreen
        title={title}
        loading="lazy"
      />
    </div>
  );
}
