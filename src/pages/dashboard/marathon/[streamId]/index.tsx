import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import CalendarGrid from '@/components/CalendarGrid';
import styles from './MarathonCalendar.module.css';

type StreamCalendar = {
  stream: {
    id: string;
    startDate: string;
    status: string;
    template: {
      id: string;
      title: string;
      description?: string;
      durationDays: number;
    };
  };
  currentDayNumber: number;
  reports: Array<{ id: string; dayNumber: number; totalCalories: number; filledAt: Date | string }>;
};

export default function MarathonCalendarPage() {
  const router = useRouter();
  const { streamId } = router.query;

  const [data, setData] = useState<StreamCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'participant') {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!streamId) return;

    async function load() {
      try {
        const res = await fetch(`/api/streams/${streamId}/calendar`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить календарь');
        }
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [streamId]);

  if (loading) {
    return (
      <main className={styles.main}>
        <p>Загрузка...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className={styles.main}>
        <p className={styles.error}>{error || 'Не удалось загрузить календарь'}</p>
      </main>
    );
  }

  const { stream, currentDayNumber, reports } = data;

  return (
    <main className={styles.main}>
      <Link href="/dashboard" className={styles.backLink}>
        ← Назад к моим марафонам
      </Link>

      <h1 className={styles.title}>{stream.template.title}</h1>
      <p className={styles.description}>
        {stream.template.description || 'Нет описания'}
      </p>

      <div className={styles.infoBlock}>
        <p>
          <strong>Длительность:</strong> {stream.template.durationDays} дн.
        </p>
        <p>
          <strong>Дата начала:</strong>{' '}
          {new Date(stream.startDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Статус:</strong> {stream.status}
        </p>
        <p>
          <strong>Текущий день:</strong>{' '}
          {currentDayNumber > 0 ? currentDayNumber : 'Ещё не начат'}
        </p>
      </div>

      <div className={styles.actions}>
        <Link href={`/dashboard/messages?streamId=${stream.id}&group=1`}>
          <button className={styles.chatBtn}>Общий чат потока</button>
        </Link>
        <Link href={`/dashboard/messages?streamId=${stream.id}`}>
          <button className={styles.chatBtn}>Написать ментору</button>
        </Link>
      </div>

      <CalendarGrid
        streamId={stream.id}
        durationDays={stream.template.durationDays}
        currentDayNumber={currentDayNumber}
        reports={reports}
      />
    </main>
  );
}
