import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import styles from '../../TemplateDays.module.css';
import { apiFetch } from '@/lib/apiClient';

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
  videoUrl: string;
};

function createEmptyDays(count: number): DayInput[] {
  return Array.from({ length: count }, (_, index) => ({
    dayNumber: index + 1,
    textContent: '',
    audioUrl: '',
    videoUrl: '',
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

        const data: Template & { days: DayInput[] } = json.data;
        setTemplate(data);

        if (data.days && data.days.length > 0) {
          setDays(data.days);
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
              <label htmlFor={`audio-${index}`}>Ссылка на аудио</label>
              <input
                id={`audio-${index}`}
                type="url"
                value={day.audioUrl}
                onChange={(e) => updateDay(index, 'audioUrl', e.target.value)}
                disabled={!isEditable}
                className={styles.fullWidth}
              />
            </div>
            <div>
              <label htmlFor={`video-${index}`}>Ссылка на видео</label>
              <input
                id={`video-${index}`}
                type="url"
                value={day.videoUrl}
                onChange={(e) => updateDay(index, 'videoUrl', e.target.value)}
                disabled={!isEditable}
                className={styles.fullWidth}
              />
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
