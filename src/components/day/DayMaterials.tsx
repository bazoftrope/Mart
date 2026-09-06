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
  const mediaAttachments = materials.attachments.filter(
    (attachment) => attachment.kind === 'audio' || attachment.kind === 'video',
  );
  const fileAttachments = materials.attachments.filter(
    (attachment) => attachment.kind === 'file',
  );
  const hasMedia = mediaAttachments.length > 0;
  const hasFiles = fileAttachments.length > 0;
  const hasAnyContent = hasText || hasMedia || hasFiles;

  if (!hasAnyContent) {
    return (
      <section className={styles.section}>
        <p className={styles.empty}>Материалы для этого дня пока не добавлены.</p>
      </section>
    );
  }

  const hasSplitLayout = hasMedia && (hasText || hasFiles);

  return (
    <section className={styles.section}>
      <div className={hasSplitLayout ? styles.splitLayout : styles.stackLayout}>
        {hasMedia && (
          <div className={styles.mediaColumn}>
            <AttachmentPlayers attachments={mediaAttachments} />
          </div>
        )}

        {(hasText || hasFiles) && (
          <div className={styles.contentColumn}>
            {hasFiles && (
              <div className={styles.pdfBlock}>
                <div className={styles.pdfList}>
                  {fileAttachments.map((attachment) => (
                    <a
                      key={attachment.id || attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={styles.pdfLink}
                    >
                      {attachment.fileName || 'PDF'}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {hasText && (
              <div className={styles.textBlock}>
                <div
                  className={`${styles.textContent} ${styles.richText}`}
                  dangerouslySetInnerHTML={{ __html: materials.textContent || '' }}
                />
              </div>
            )}


          </div>
        )}
      </div>
    </section>
  );
}
