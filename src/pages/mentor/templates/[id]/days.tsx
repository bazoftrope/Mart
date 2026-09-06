import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import styles from '../../TemplateDays.module.css';
import { apiFetch } from '@/lib/apiClient';
import RichTextEditor from '@/components/editor/RichTextEditor';
import AttachmentManager from '@/components/mentor/AttachmentManager';
import type { AttachmentData } from '@/types/attachments';

type Template = {
  id: string;
  title: string;
  durationDays: number;
  status: 'draft' | 'pending_review' | 'approved';
};

type DayInput = {
  dayNumber: number;
  textContent: string;
  isMeasurementDay: boolean;
  attachments: AttachmentData[];
};

type ApiDay = {
  id: string;
  dayNumber: number;
  textContent: string | null;
  isMeasurementDay: boolean;
  attachments: AttachmentData[];
};

function createEmptyDays(count: number): DayInput[] {
  return Array.from({ length: count }, (_, index) => ({
    dayNumber: index + 1,
    textContent: '',
    isMeasurementDay: false,
    attachments: [],
  }));
}

function toPayloadAttachment(attachment: AttachmentData) {
  return {
    kind: attachment.kind,
    url: attachment.url,
    fileName: attachment.fileName ?? null,
    mimeType: attachment.mimeType ?? null,
    sizeBytes: attachment.sizeBytes ?? null,
  };
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

        const data = json.data as Template & { days: ApiDay[] };
        setTemplate(data);

        if (data.days && data.days.length > 0) {
          setDays(
            data.days.map((day) => ({
              dayNumber: day.dayNumber,
              textContent: day.textContent || '',
              isMeasurementDay: day.isMeasurementDay || false,
              attachments: day.attachments || [],
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

  function updateDay(index: number, field: keyof DayInput, value: string | number | boolean | AttachmentData[]) {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function updateDayAttachments(index: number, attachments: AttachmentData[]) {
    updateDay(index, 'attachments', attachments);
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
        body: JSON.stringify({
          days: days.map((day) => ({
            dayNumber: day.dayNumber,
            textContent: day.textContent,
            isMeasurementDay: day.isMeasurementDay,
            attachments: day.attachments.map(toPayloadAttachment),
          })),
        }),
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
          <button>Назад к шаблонам</button>
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
      <h1>Шаг 3 из 3. Дни: {template.title}</h1>
      <p>
        Длительность: {template.durationDays} дн. Для каждого дня можно написать текст в
        редакторе, прикрепить PDF-документы и добавить аудио/видео. День можно оставить пустым.
      </p>

      <Link href={`/mentor/templates/${templateId}/intro`}>
        <button type="button" className="btn btnOutline">← Назад к предстартовой странице</button>
      </Link>

      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={handleSave}>
        {days.map((day, index) => (
          <fieldset key={index} className={styles.fieldset}>
            <legend>День {day.dayNumber}</legend>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={day.isMeasurementDay}
                  disabled={!isEditable}
                  onChange={(e) =>
                    updateDay(index, 'isMeasurementDay', e.target.checked)
                  }
                />
                День замера (вес и охваты)
              </label>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor={`text-${index}`}>Текстовое содержимое (визуальный редактор)</label>
              <RichTextEditor
                value={day.textContent}
                onChange={(html) => updateDay(index, 'textContent', html)}
                disabled={!isEditable}
                placeholder="Текст дня..."
              />
            </div>

            {templateId && (
              <>
                <AttachmentManager
                  templateId={templateId}
                  kind="file"
                  label="Документы (PDF)"
                  attachments={day.attachments}
                  onChange={(attachments) => updateDayAttachments(index, attachments)}
                  disabled={!isEditable}
                />
                <AttachmentManager
                  templateId={templateId}
                  kind="audio"
                  label="Аудио для дня"
                  attachments={day.attachments}
                  onChange={(attachments) => updateDayAttachments(index, attachments)}
                  disabled={!isEditable}
                />
                <AttachmentManager
                  templateId={templateId}
                  kind="video"
                  label="Видео для дня"
                  attachments={day.attachments}
                  onChange={(attachments) => updateDayAttachments(index, attachments)}
                  disabled={!isEditable}
                />
              </>
            )}
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
