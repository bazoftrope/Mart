import type { DayMaterialsData } from '@/types/participantDay';
import AttachmentPlayers from '@/components/attachments/AttachmentPlayers';
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

  const hasText = Boolean(materials.textContent);
  const hasAttachments = materials.attachments.length > 0;
  const hasAnyContent = hasText || hasAttachments;

  if (!hasAnyContent) {
    return (
      <section className={styles.section}>
        <p className={styles.empty}>Материалы для этого дня пока не добавлены.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={hasText && hasAttachments ? styles.splitLayout : styles.stackLayout}>
        {hasAttachments && (
          <div className={styles.mediaColumn}>
            <AttachmentPlayers attachments={materials.attachments} />
          </div>
        )}

        {hasText && (
          <div className={styles.contentColumn}>
            <div className={styles.textBlock}>
              <div
                className={`${styles.textContent} ${styles.richText}`}
                dangerouslySetInnerHTML={{ __html: materials.textContent || '' }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
