import { useRef, useState } from 'react';
import type { AttachmentData } from '@/types/attachments';
import { apiFetch } from '@/lib/apiClient';
import { groupPairedAttachments } from '@/lib/attachmentGroups';
import styles from './PairManager.module.css';

type PairManagerProps = {
  templateId: string;
  attachments: AttachmentData[];
  onChange: (next: AttachmentData[]) => void;
  disabled?: boolean;
};

type UploadedFileMeta = {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

type PairUploadData = {
  pairId: string;
  pdf: UploadedFileMeta;
  audio: UploadedFileMeta;
};

export default function PairManager({
  templateId,
  attachments,
  onChange,
  disabled = false,
}: PairManagerProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const pairs = groupPairedAttachments(attachments);

  function resetForm() {
    setOpen(false);
    setError(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
  }

  async function handleAdd() {
    const pdfFile = pdfInputRef.current?.files?.[0] ?? null;
    const audioFile = audioInputRef.current?.files?.[0] ?? null;

    if (!pdfFile || !audioFile) {
      setError('Выберите и PDF, и аудиофайл для комплекта');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('templateId', templateId);
      form.append('pdf', pdfFile);
      form.append('audio', audioFile);

      const res = await apiFetch('/api/uploads/pair', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось загрузить комплект');
      }

      const data = json.data as PairUploadData;
      const basePosition =
        attachments.reduce((max, attachment) => Math.max(max, attachment.position ?? -1), -1) + 1;

      const added: AttachmentData[] = [
        {
          kind: 'file',
          url: data.pdf.url,
          fileName: data.pdf.fileName,
          mimeType: data.pdf.mimeType,
          sizeBytes: data.pdf.sizeBytes,
          pairId: data.pairId,
          position: basePosition,
        },
        {
          kind: 'audio',
          url: data.audio.url,
          fileName: data.audio.fileName,
          mimeType: data.audio.mimeType,
          sizeBytes: data.audio.sizeBytes,
          pairId: data.pairId,
          position: basePosition,
        },
      ];

      onChange([...attachments, ...added]);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setUploading(false);
    }
  }

  function removePair(pairId: string) {
    if (disabled) return;
    onChange(attachments.filter((attachment) => attachment.pairId !== pairId));
  }

  return (
    <div className={styles.block}>
      <div className={styles.header}>
        <span className={styles.label}>Комплекты PDF + аудио</span>
        <span className={styles.count}>{pairs.length}</span>
      </div>

      {pairs.length === 0 && <p className={styles.empty}>Пока пусто.</p>}

      {pairs.map((pair) => (
        <div key={pair.pairId} className={styles.item}>
          <div className={styles.itemHeader}>
            <div className={styles.fileNames}>
              <span>{pair.pdf?.fileName || 'PDF'}</span>
              {pair.audio?.fileName && <span>+ {pair.audio.fileName}</span>}
            </div>
            {!disabled && (
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removePair(pair.pairId)}
              >
                Удалить комплект
              </button>
            )}
          </div>

          {pair.pdf && (
            <a
              href={pair.pdf.url}
              target="_blank"
              rel="noreferrer"
              className={styles.fileLink}
            >
              Открыть PDF
            </a>
          )}

          {pair.audio && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio
              controls
              preload="metadata"
              className={styles.audio}
              src={pair.audio.url}
            />
          )}
        </div>
      ))}

      {!disabled && (
        <div className={styles.controls}>
          {!open ? (
            <button
              type="button"
              className={styles.addButton}
              onClick={() => {
                setOpen(true);
                setError(null);
              }}
            >
              Добавить комплект
            </button>
          ) : (
            <>
              <div className={styles.formRow}>
                <label className={styles.fileLabel}>
                  PDF
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    disabled={uploading}
                    className={styles.fileInput}
                  />
                </label>
                <label className={styles.fileLabel}>
                  Аудио
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    disabled={uploading}
                    className={styles.fileInput}
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.uploadButton}
                  onClick={handleAdd}
                  disabled={uploading}
                >
                  {uploading ? 'Загрузка...' : 'Загрузить комплект'}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={resetForm}
                  disabled={uploading}
                >
                  Отмена
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
