import type { DayMaterialsData } from '@/types/participantDay';
import styles from './DayMaterials.module.css';

type DayMaterialsProps = {
  materials: DayMaterialsData | null;
};

export default function DayMaterials({ materials }: DayMaterialsProps) {
  if (!materials) {
    return (
      <section className={styles.section}>
        <p className={styles.empty}>Материалы для этого дня пока не добавлены.</p>
      </section>
    );
  }

  const hasAnyContent =
    materials.textContent || materials.audioUrl || materials.videoUrl;

  if (!hasAnyContent) {
    return (
      <section className={styles.section}>
        <p className={styles.empty}>Материалы для этого дня пока не добавлены.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      {materials.textContent && (
        <div className={styles.textContent}>{materials.textContent}</div>
      )}

      {materials.audioUrl && (
        <div className={styles.mediaBlock}>
          <strong>Аудио:</strong>{' '}
          <a
            href={materials.audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mediaLink}
          >
            Слушать
          </a>
        </div>
      )}

      {materials.videoUrl && (
        <div className={styles.mediaBlock}>
          <strong>Видео:</strong>{' '}
          <a
            href={materials.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mediaLink}
          >
            Смотреть
          </a>
        </div>
      )}
    </section>
  );
}
