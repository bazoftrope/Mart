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

  return (
    <section className={styles.section}>
      {materials.audioUrl && (
        <div className={styles.mediaBlock}>
          <div className={styles.audioWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/media-has-caption */}
            <audio controls preload="metadata" className={styles.audioPlayer} src={materials.audioUrl}>
              Ваш браузер не поддерживает воспроизведение аудио.
            </audio>
          </div>
          {/*<a
            href={materials.audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mediaLink}
          >
            Открыть аудио
          </a>*/}
        </div>
      )}


      {materials.videoId && (
        <div className={styles.mediaBlock}>
          <KinescopePlayer videoId={materials.videoId} />
        </div>
      )}
      {materials.textContent && (
        <div className={styles.textContent}>{materials.textContent}</div>
      )}


    </section>
  );
}
