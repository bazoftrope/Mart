import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { PublicUser } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';
import styles from './AdminReviewTemplate.module.css';
import { apiFetch } from '@/lib/apiClient';

type TemplateDay = {
  id: string;
  dayNumber: number;
  textContent?: string;
  audioUrl?: string;
  videoUrl?: string;
};

type TemplateDetail = {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  mentor: PublicUser | null;
  days: TemplateDay[];
};

export default function AdminReviewTemplatePage() {
  const router = useRouter();
  const { id } = router.query;
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'admin') {
      router.push('/login');
      return;
    }

    if (!id || typeof id !== 'string') return;

    async function load() {
      try {
        const res = await apiFetch(`/api/admin/pending/${id}`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить шаблон');
        }

        setTemplate(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

  async function handleApprove() {
    if (!template || typeof id !== 'string') return;

    setApproving(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/admin/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось одобрить шаблон');
      }

      setApproved(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setApproving(false);
    }
  }

  return (
    <main className={styles.main}>
      <p>
        <Link href="/admin">← Назад к списку</Link>
      </p>
      <h1>Проверка шаблона</h1>
      {loading && <p>Загрузка...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !template && !error && <p>Шаблон не найден.</p>}
      {template && (
        <>
          <section className={styles.section}>
            <h2>{template.title}</h2>
            {template.description && <p>{template.description}</p>}
            <p>
              <strong>Длительность:</strong> {template.durationDays} дн.
            </p>
            <p>
              <strong>Ментор:</strong>{' '}
              {template.mentor
                ? `${template.mentor.name} (${template.mentor.email})`
                : 'Неизвестно'}
            </p>
            <p>
              <strong>Статус:</strong> {template.status}
            </p>
          </section>

          <section className={styles.section}>
            <h3>Дни</h3>
            {template.days.length === 0 && <p>Дни не настроены.</p>}
            {template.days.map((day) => (
              <article
                key={day.id}
                className={styles.card}
              >
                <h4 className={styles.cardTitle}>День {day.dayNumber}</h4>
                {day.textContent ? (
                  <p className={styles.preWrap}>{day.textContent}</p>
                ) : (
                  <p className={styles.muted}>Нет содержимого</p>
                )}
                {day.audioUrl && (
                  <p>
                    <a href={day.audioUrl} target="_blank" rel="noreferrer">
                      Аудио
                    </a>
                  </p>
                )}
                {day.videoUrl && (
                  <p>
                    <a href={day.videoUrl} target="_blank" rel="noreferrer">
                      Видео
                    </a>
                  </p>
                )}
              </article>
            ))}
          </section>

          {approved ? (
            <p className={styles.success}>
              Шаблон одобрен. Перенаправление...
            </p>
          ) : (
            <button
              onClick={handleApprove}
              disabled={approving}
              className={styles.approveBtn}
            >
              {approving ? 'Одобрение...' : 'Одобрить шаблон'}
            </button>
          )}
        </>
      )}
    </main>
  );
}
