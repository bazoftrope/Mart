import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import styles from '../../TemplateDays.module.css';
import { apiFetch } from '@/lib/apiClient';
import KinescopePlayer from '@/components/day/KinescopePlayer';
import { parseKinescopeVideoId } from '@/lib/kinescope';

type Template = {
  id: string;
  title: string;
  durationDays: number;
  status: 'draft' | 'pending_review' | 'approved';
};

type DayInput = {
  dayNumber: number;
  textContent: string;
  audioUrl: string;
  videoLink: string;
};

function createEmptyDays(count: number): DayInput[] {
  return Array.from({ length: count }, (_, index) => ({
    dayNumber: index + 1,
    textContent: '',
    audioUrl: '',
    videoLink: '',
  }));
}

export default function TemplateDaysPage() {
  const router = useRouter();
  const { id } = router.query;
  const templateId = typeof id === 'string' ? id : undefined;

  const [template, setTemplate] = useState<Template | null>(null);
  const [days, setDays] = useState<DayInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'mentor') {
      router.push('/login');
      return;
    }

    if (!templateId) return;

    async function load() {
      try {
        const res = await apiFetch(`/api/marathons/${templateId}`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить шаблон');
        }

        const data = json.data as Template & { days: Array<Omit<DayInput, 'videoLink'> & { videoId?: string | null }> };
        setTemplate(data);

        if (data.days && data.days.length > 0) {
          setDays(
            data.days.map((day) => ({
              dayNumber: day.dayNumber,
              textContent: day.textContent || '',
              audioUrl: day.audioUrl || '',
              videoLink: day.videoId
                ? `https://kinescope.io/embed/${day.videoId}`
                : '',
            }))
          );
        } else {
          setDays(createEmptyDays(data.durationDays));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, templateId]);

  function updateDay(index: number, field: keyof DayInput, value: string | number) {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleAudioUpload(index: number, file: File | undefined) {
    if (!templateId || !file) return;

    setUploadingIndex(index);
    setError(null);

    try {
      const form = new FormData();
      form.append('templateId', templateId);
      form.append('dayNumber', String(days[index].dayNumber));
      form.append('file', file);

      const res = await apiFetch('/api/uploads/audio', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось загрузить аудио');
      }

      updateDay(index, 'audioUrl', json.data.url);
      alert('Аудио успешно загружено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setUploadingIndex(null);
    }
  }

  function absoluteAudioUrl(url: string): string {
    if (!url) return '';
    if (/^https?:\/\//.test(url) || url.startsWith('//')) return url;
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!templateId) return;

    setError(null);
    setSaving(true);

    try {
      const res = await apiFetch(`/api/marathons/${templateId}/days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ days }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось сохранить дни');
      }

      alert('Дни успешно сохранены');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!templateId) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch(`/api/marathons/${templateId}/submit`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось отправить шаблон');
      }

      router.push('/mentor/templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <p>Загрузка...</p>
      </main>
    );
  }

  if (error && !template) {
    return (
      <main className={styles.main}>
        <p className={styles.error}>{error}</p>
        <Link href="/mentor/templates">
          <button>Back to Templates</button>
        </Link>
      </main>
    );
  }

  if (!template) {
    return (
      <main className={styles.main}>
        <p>Шаблон не найден.</p>
      </main>
    );
  }

  const isEditable = template.status === 'draft';

  return (
    <main className={styles.main}>
      <h1>Дни: {template.title}</h1>
      <p>
        Длительность: {template.durationDays} дн. Заполните содержимое для каждого дня.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={handleSave}>
        {days.map((day, index) => (
          <fieldset
            key={index}
            className={styles.fieldset}
          >
            <legend>День {day.dayNumber}</legend>
            <div className={styles.formGroup}>
              <label htmlFor={`text-${index}`}>Текстовое содержимое</label>
              <textarea
                id={`text-${index}`}
                value={day.textContent}
                onChange={(e) => updateDay(index, 'textContent', e.target.value)}
                rows={6}
                disabled={!isEditable}
                className={styles.fullWidth}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Аудио для дня</label>
              {day.audioUrl ? (
                <div className={styles.audioPreview}>
                  <audio controls src={absoluteAudioUrl(day.audioUrl)} style={{ width: '100%' }} />
                  {isEditable && (
                    <button
                      type="button"
                      className={styles.removeAudioBtn}
                      onClick={() => updateDay(index, 'audioUrl', '')}
                    >
                      Удалить аудио
                    </button>
                  )}
                </div>
              ) : (
                <p className={styles.hint}>Аудио для этого дня не добавлено.</p>
              )}
              {isEditable && (
                <div className={styles.uploadRow}>
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={uploadingIndex !== null}
                    onChange={(e) => handleAudioUpload(index, e.target.files?.[0])}
                  />
                  {uploadingIndex === index && <span className={styles.hint}>Загрузка...</span>}
                </div>
              )}
              {isEditable && (
                <div className={styles.formGroup}>
                  <label htmlFor={`audio-${index}`}>Или вставьте ссылку на аудио</label>
                  <input
                    id={`audio-${index}`}
                    type="text"
                    value={day.audioUrl}
                    onChange={(e) => updateDay(index, 'audioUrl', e.target.value)}
                    placeholder="https://..."
                    className={styles.fullWidth}
                  />
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor={`video-${index}`}>Ссылка на видео</label>
              <input
                id={`video-${index}`}
                type="url"
                value={day.videoLink}
                onChange={(e) => updateDay(index, 'videoLink', e.target.value)}
                disabled={!isEditable}
                placeholder="https://kinescope.io/..."
                className={styles.fullWidth}
              />
              <small className={styles.hint}>
                Скопируйте ссылку на видео из Kinescope (например, https://kinescope.io/5xHZrDYYHwJwfcbKJv2FUr)
              </small>
              {day.videoLink &&
                (() => {
                  const videoId = parseKinescopeVideoId(day.videoLink);
                  return videoId ? (
                    <div className={styles.videoPreview}>
                      <KinescopePlayer videoId={videoId} />
                    </div>
                  ) : (
                    <p className={styles.error}>Некорректная ссылка Kinescope</p>
                  );
                })()}
            </div>
          </fieldset>
        ))}

        <div className={styles.buttonRow}>
          {isEditable && (
            <>
              <button type="submit" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить дни'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className={styles.submitReviewBtn}
              >
                {submitting ? 'Отправка...' : 'Отправить на проверку'}
              </button>
            </>
          )}
          <Link href="/mentor/templates">
            <button type="button">Назад к шаблонам</button>
          </Link>
        </div>
      </form>
    </main>
  );
}
