import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import styles from './index.module.css';
import { apiFetch } from '@/lib/apiClient';
import StreamCard from '@/components/stream/StreamCard';
import cardStyles from '@/components/stream/StreamCard.module.css';

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
        const res = await apiFetch('/api/streams');
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
      <div className={styles.hero}>
        <Image src="/logo.png" alt="Marathon Platform" width={80} height={80} className={styles.logo} />
        <div>
          <h1 className="pageTitle">Добро пожаловать на Marathon Platform</h1>
          <p className={styles.lead}>
            Платформа для марафонов здорового питания. Менторы создают шаблоны
            марафонов, администраторы проверяют их, а участники присоединяются к потокам,
            чтобы отслеживать своё ежедневное питание и прогресс.
          </p>
        </div>
      </div>



      <section className="mt-2-5">
        <h2 className="pageSubtitle">Открытые потоки</h2>
        {loading && <p>Загрузка потоков...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && streams.length === 0 && (
          <p>Сейчас нет открытых потоков.</p>
        )}
        {!loading && !error && streams.length > 0 && (
          <ul className={cardStyles.grid}>
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                title={stream.template?.title || 'Поток без названия'}
                href={`/streams/${stream.id}`}
                description={stream.template?.description || 'Нет описания'}
                durationDays={stream.template?.durationDays}
                startDate={stream.startDate}
                mentorName={stream.mentor?.name || 'Неизвестно'}
                status={stream.status}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
