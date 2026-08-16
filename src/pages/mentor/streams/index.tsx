import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import styles from './MentorStreams.module.css';
import { apiFetch } from '@/lib/apiClient';

type StreamItem = {
  id: string;
  startDate: string;
  status: string;
  template: {
    id: string;
    title: string;
    description?: string;
    durationDays: number;
  } | null;
};

export default function MentorStreamsPage() {
  const router = useRouter();
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'mentor') {
      router.push('/login');
      return;
    }

    async function load() {
      try {
        const res = await apiFetch('/api/streams/my', { credentials: 'include' });
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

    load();
  }, [router]);

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1>Мои потоки</h1>
        <Link href="/mentor/streams/launch">
          <button className={styles.launchBtn}>Запустить поток</button>
        </Link>
      </div>

      {loading && <p>Загрузка...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && streams.length === 0 && (
        <p className={styles.emptyText}>Вы ещё не запустили ни одного потока.</p>
      )}
      {!loading && !error && streams.length > 0 && (
        <ul className={styles.list}>
          {streams.map((stream) => (
            <li
              key={stream.id}
              className={styles.listItem}
            >
              <Link href={`/mentor/streams/${stream.id}`} className={styles.streamLink}>
                <h2 className={styles.streamTitle}>{stream.template?.title || 'Поток без названия'}</h2>
              </Link>
              <p className={styles.info}>
                <strong>Дата начала:</strong> {new Date(stream.startDate).toLocaleDateString()}
              </p>
              <p className={styles.info}>
                <strong>Длительность:</strong> {stream.template?.durationDays} дн.
              </p>
              <p className={styles.info}>
                <strong>Статус:</strong> {stream.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
