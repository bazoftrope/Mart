import { useRef, useState } from 'react';
import type { AttachmentData, AttachmentKind } from '@/types/attachments';
import { apiFetch } from '@/lib/apiClient';
import { normalizeKinescopeVideoId } from '@/lib/kinescope';
import KinescopePlayer from '@/components/day/KinescopePlayer';
import styles from './AttachmentManager.module.css';

type AttachmentManagerProps = {
  templateId: string;
  kind: AttachmentKind;
  label: string;
  attachments: AttachmentData[];
  onChange: (next: AttachmentData[]) => void;
  disabled?: boolean;
};

export default function AttachmentManager({
  templateId,
  kind,
  label,
  attachments,
  onChange,
  disabled = false,
}: AttachmentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [videoInput, setVideoInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = attachments
    .filter((attachment) => attachment.kind === kind && !attachment.pairId)
    .map((attachment, index) => ({ ...attachment, position: index }));

  function setFiltered(next: AttachmentData[]) {
    const others = attachments.filter(
      (attachment) => attachment.kind !== kind || Boolean(attachment.pairId),
    );
    onChange([...others, ...next]);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || disabled) return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('templateId', templateId);
      Array.from(fileList).forEach((file) => form.append('files', file));

      const endpoint = kind === 'audio' ? '/api/uploads/audio' : '/api/uploads/file';
      const res = await apiFetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось загрузить файл');
      }

      const uploaded = (json.data?.files || []).map((file: { url: string; fileName: string; mimeType: string; sizeBytes: number }) => ({
        kind,
        url: file.url,
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      }));

      setFiltered([...filtered, ...uploaded]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setUploading(false);
    }
  }

  function handleAddVideo() {
    if (disabled) return;
    const videoId = normalizeKinescopeVideoId(videoInput);
    if (!videoId) {
      setError('Вставьте корректную ссылку Kinescope (https://kinescope.io/...)');
      return;
    }

    setError(null);
    setFiltered([
      ...filtered,
      {
        kind: 'video',
        url: videoId,
        fileName: 'Видео',
      },
    ]);
    setVideoInput('');
  }

  function removeAt(index: number) {
    if (disabled) return;
    setFiltered(filtered.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.block}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.count}>{filtered.length}</span>
      </div>

      {filtered.length === 0 && <p className={styles.empty}>Пока пусто.</p>}

      {filtered.map((attachment, index) => (
        <div key={attachment.id || attachment.url || index} className={styles.item}>
          {kind === 'audio' && (
            <>
              {attachment.fileName && (
                <span className={styles.fileName}>{attachment.fileName}</span>
              )}
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio
                controls
                preload="metadata"
                className={styles.audio}
                src={attachment.url}
              />
            </>
          )}

          {kind === 'video' && (
            <div className={styles.videoPreview}>
              <KinescopePlayer
                videoId={normalizeKinescopeVideoId(attachment.url) || attachment.url}
                title={attachment.fileName || 'Видео'}
              />
            </div>
          )}

          {kind === 'file' && (
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className={styles.fileLink}
            >
              {attachment.fileName || 'Открыть PDF'}
            </a>
          )}

          {!disabled && (
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => removeAt(index)}
            >
              Удалить
            </button>
          )}
        </div>
      ))}

      {!disabled && (
        <div className={styles.controls}>
          {kind === 'video' ? (
            <div className={styles.videoAddRow}>
              <input
                type="text"
                className={styles.videoInput}
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="https://kinescope.io/..."
              />
              <button
                type="button"
                className={styles.addButton}
                onClick={handleAddVideo}
              >
                Добавить
              </button>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={kind === 'audio' ? 'audio/*' : 'application/pdf'}
                multiple
                disabled={uploading}
                onChange={(e) => handleFiles(e.target.files)}
                className={styles.fileInput}
              />
              {uploading && <span className={styles.hint}>Загрузка...</span>}
            </>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
