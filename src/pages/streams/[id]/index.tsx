import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import styles from './index.module.css';
import { apiFetch } from '@/lib/apiClient';

type StreamDetails = {
  id: string;
  startDate: string;
  status: string;
  createdAt: string;
  enrollmentsCount: number;
  isEnrolled: boolean;
  template: {
    id: string;
    title: string;
    description?: string;
    durationDays: number;
    status: string;
  } | null;
  mentor: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export default function StreamPage() {
  const router = useRouter();
  const { id } = router.query;
  const role = useAuthStore((s) => s.role);

  const [stream, setStream] = useState<StreamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
  }, []);

  useEffect(() => {
    if (!id) return;

    async function loadStream() {
      try {
        const res = await apiFetch(`/api/streams/${id}`, { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить поток');
        }
        setStream(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
      } finally {
        setLoading(false);
      }
    }

    loadStream();
  }, [id]);

  async function handleEnroll() {
    if (!stream) return;
    setEnrolling(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/streams/${stream.id}/enroll`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Не удалось записаться');
      }

      setStream({ ...stream, isEnrolled: true, enrollmentsCount: stream.enrollmentsCount + 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) return <main className="container"><p>Загрузка...</p></main>;
  if (error) return <main className="container"><p className="error">{error}</p></main>;
  if (!stream) return <main className="container"><p>Поток не найден</p></main>;

  return (
    <main className="container">
      <Link href="/" className="backLink">← Назад к потокам</Link>
      <h1 className="mt-1">{stream.template?.title || 'Поток'}</h1>
      <p className={styles.description}>
        {stream.template?.description || 'Нет описания'}
      </p>

      <div className={styles.details}>
        <p><strong>Длительность:</strong> {stream.template?.durationDays} дн.</p>
        <p><strong>Дата начала:</strong> {new Date(stream.startDate).toLocaleDateString()}</p>
        <p><strong>Статус:</strong> {stream.status}</p>
        <p><strong>Ментор:</strong> {stream.mentor?.name || 'Неизвестно'}</p>
        <p><strong>Участников:</strong> {stream.enrollmentsCount}</p>
      </div>

      {role === 'participant' && (
        <div className="mt-1-5">
          {stream.isEnrolled ? (
            <button disabled className="btn">
              Вы записаны
            </button>
          ) : stream.status === 'finished' ? (
            <button disabled className="btn">
              Поток завершён
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="btn btnPrimary"
            >
              {enrolling ? 'Запись...' : 'Записаться в поток'}
            </button>
          )}
        </div>
      )}

      {role !== 'participant' && role !== null && (
        <p className="textMuted mt-1-5">
          Только участники могут записываться в потоки.
        </p>
      )}

      {role === null && (
        <p className="mt-1-5">
          <Link href="/login">Войдите</Link> или <Link href="/register">зарегистрируйтесь</Link>, чтобы записаться.
        </p>
      )}
    </main>
  );
}
