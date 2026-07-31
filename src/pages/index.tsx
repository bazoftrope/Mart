import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import styles from './index.module.css';

type Mentor = {
  id: string;
  name: string;
  email: string;
};

type Template = {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
};

type Stream = {
  id: string;
  startDate: string;
  status: string;
  template: Template | null;
  mentor: Mentor | null;
};

export default function Home() {
  const role = useAuthStore((s) => s.role);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    useAuthStore.getState().initAuth();

    async function loadStreams() {
      try {
        const res = await fetch('/api/streams');
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить потоки');
        }
        setStreams(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
      } finally {
        setLoading(false);
      }
    }

    loadStreams();
  }, []);

  return (
    <main className="container">
      <h1 className="pageTitle">Добро пожаловать на Marathon Platform</h1>
      <p className={styles.lead}>
        Платформа для марафонов здорового питания. Менторы создают шаблоны
        марафонов, администраторы проверяют их, а участники присоединяются к потокам,
        чтобы отслеживать своё ежедневное питание и прогресс.
      </p>

      {!role && (
        <div className={styles.actions}>
          <Link href="/login">
            <button className="btn btnPrimary">Войти</button>
          </Link>
          <Link href="/register">
            <button className="btn btnOutline">Регистрация</button>
          </Link>
        </div>
      )}

      <section className="mt-2-5">
        <h2 className="pageSubtitle">Открытые потоки</h2>
        {loading && <p>Загрузка потоков...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && streams.length === 0 && (
          <p>Сейчас нет открытых потоков.</p>
        )}
        {!loading && !error && streams.length > 0 && (
          <ul className="listPlain mt-1">
            {streams.map((stream) => (
              <li key={stream.id} className="card">
                <Link href={`/streams/${stream.id}`} className="cardLink">
                  <h3 className="cardTitle">
                    {stream.template?.title || 'Поток без названия'}
                  </h3>
                </Link>
                <p className="meta textSecondary">
                  {stream.template?.description || 'Нет описания'}
                </p>
                <p className="meta">
                  <strong>Длительность:</strong> {stream.template?.durationDays} дн.
                </p>
                <p className="meta">
                  <strong>Дата начала:</strong>{' '}
                  {new Date(stream.startDate).toLocaleDateString()}
                </p>
                <p className="meta">
                  <strong>Ментор:</strong> {stream.mentor?.name || 'Неизвестно'}
                </p>
                <p className="meta">
                  <strong>Статус:</strong> {stream.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
