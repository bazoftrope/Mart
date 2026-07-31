import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import styles from './Rating.module.css';

type RatingEntry = {
  rank: number;
  participantId: string;
  participantName: string;
  filledDays: number;
  disciplinePercent: number;
  calculatedAt: string;
};

type RatingData = {
  streamId: string;
  ratings: RatingEntry[];
};

export default function RatingPage() {
  const router = useRouter();
  const { streamId } = router.query;
  const userId = useAuthStore((s) => s.userId);

  const [data, setData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const { role } = useAuthStore.getState();
    if (role !== 'participant') {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!streamId) return;

    async function load() {
      try {
        const res = await fetch(`/api/streams/${streamId}/rating`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить рейтинг');
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
        <p>Loading...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className={styles.main}>
        <p className={styles.error}>{error || 'Failed to load rating'}</p>
      </main>
    );
  }

  const { ratings } = data;

  return (
    <main className={styles.main}>
      <Link href={`/dashboard/marathon/${streamId}`} className={styles.backLink}>
        &larr; Назад к календарю
      </Link>

      <h1 className={styles.title}>Рейтинг</h1>

      {ratings.length === 0 ? (
        <p className={styles.empty}>Рейтинг ещё не рассчитан.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.cell}>#</th>
              <th className={styles.cell}>Участник</th>
              <th className={styles.cell}>Заполнено дней</th>
              <th className={styles.cell}>Дисциплина</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map((entry) => {
              const isMe = entry.participantId === userId;
              return (
                <tr
                  key={entry.participantId}
                  className={styles.row}
                  style={{
                    backgroundColor: isMe ? '#f0f7ff' : undefined,
                    fontWeight: isMe ? 600 : undefined,
                  }}
                >
                  <td className={styles.cell}>{entry.rank}</td>
                  <td className={styles.cell}>
                    {entry.participantName}
                    {isMe && ' (вы)'}
                  </td>
                  <td className={styles.cell}>{entry.filledDays}</td>
                  <td className={styles.cell}>{entry.disciplinePercent}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
