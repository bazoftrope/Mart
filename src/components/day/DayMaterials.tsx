import type { DayMaterialsData } from '@/types/participantDay';
import KinescopePlayer from './KinescopePlayer';
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
    materials.textContent || materials.audioUrl || materials.videoId;

  if (!hasAnyContent) {
    return (
      <section className={styles.section}>
        <p className={styles.empty}>Материалы для этого дня пока не добавлены.</p>
      </section>
    );
  }

  const hasMedia = Boolean(materials.audioUrl || materials.videoId);

  return (
    <section className={styles.section}>
      <div className={hasMedia ? styles.layout : undefined}>
        {/* Левая колонка: медиа */}
        {hasMedia && (
          <div className={styles.mediaColumn}>
            {materials.audioUrl && (
              <div className={styles.mediaBlock}>
                <div className={styles.audioWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/media-has-caption */}
                  <audio
                    controls
                    preload="metadata"
                    className={styles.audioPlayer}
                    src={materials.audioUrl}
                  >
                    Ваш браузер не поддерживает воспроизведение аудио.
                  </audio>
                </div>
              </div>
            )}

            {materials.videoId && (
              <div className={styles.mediaBlock}>
                <KinescopePlayer videoId={materials.videoId} />
              </div>
            )}
          </div>
        )}

        {/* Правая колонка: текст */}
        {materials.textContent && (
          <div className={styles.textContent}>
            {materials.textContent}
          </div>
        )}
      </div>
    </section>
  );
}
