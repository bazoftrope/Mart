import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/apiClient';
import type { Goal } from '@db/models/StreamEnrollment';
import MarathonWindow, {
  type MarathonRating,
  type MarathonReport,
  type MarathonStream,
} from '@/components/marathon/MarathonWindow';
import styles from './MarathonCalendar.module.css';

type StreamCalendar = {
  stream: MarathonStream;
  currentDayNumber: number;
  targetCalories: number | null;
  goal: Goal | null;
  rating: MarathonRating;
  reports: MarathonReport[];
};

function toNumber(value: unknown): number | null {
  if (Array.isArray(value)) {
    value = value[0];
  }
  if (typeof value !== 'string') return null;
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
}

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

    const sid = Array.isArray(streamId) ? streamId[0] : streamId;
    if (!sid) return;

    async function load() {
      try {
        const res = await apiFetch(`/api/streams/${sid}/calendar`, {
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

  const { stream, currentDayNumber, targetCalories, goal, reports, rating } = data;

  if (stream.status === 'finished') {
    router.replace(`/dashboard/marathon/${stream.id}/results`);
    return null;
  }

  const requestedDay = toNumber(router.query.day);
  const activeDay =
    requestedDay !== null &&
    requestedDay >= 1 &&
    requestedDay <= stream.template.durationDays
      ? requestedDay
      : currentDayNumber > 0
        ? currentDayNumber
        : null;

  const handleDayChange = (day: number) => {
    const tab = router.query.tab;
    const tabQuery = typeof tab === 'string' ? `&tab=${tab}` : '';
    router.replace(
      `/dashboard/marathon/${stream.id}?day=${day}${tabQuery}`,
      undefined,
      { shallow: true, scroll: false }
    );
  };

  return (
    <main className={styles.main}>
      <MarathonWindow
        stream={stream}
        currentDayNumber={currentDayNumber}
        targetCalories={targetCalories}
        goal={goal}
        rating={rating}
        reports={reports}
        activeDay={activeDay}
        onDayChange={handleDayChange}
      />
    </main>
  );
}