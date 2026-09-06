import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import styles from './results.module.css';
import { apiFetch } from '@/lib/apiClient';

type ResultsData = {
  stream: {
    title: string;
    startDate: string;
    endDate: string;
    durationDays: number;
  };
  participant: {
    dailyCalories: Array<{ day: number; calories: number }>;
    dailyWeights: Array<{ day: number; weightKg: number }>;
    avgCalories: number;
    totalDays: number;
  };
  streamAverage: Array<{ day: number; avgCalories: number }>;
  summary: {
    rank: number | null;
    weightLossPercent: number;
    entryWeight: number | null;
    currentWeight: number | null;
    filledDays: number;
    disciplinePercent: number;
    avgCalories: number;
    streamAvgCalories: number;
    totalParticipants: number;
  };
};

export default function ResultsPage() {
  const router = useRouter();
  const rawStreamId = router.query.streamId;
  const streamId = Array.isArray(rawStreamId) ? rawStreamId[0] : rawStreamId;

  const [data, setData] = useState<ResultsData | null>(null);
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
        const res = await apiFetch(`/api/streams/${streamId}/results`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить результаты');
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
        <p className={styles.error}>{error || 'Не удалось загрузить результаты'}</p>
      </main>
    );
  }

  const { stream, participant, streamAverage, summary } = data;

  const chartData = participant.dailyCalories.map((d) => {
    const avg = streamAverage.find((a) => a.day === d.day);
    return {
      day: d.day,
      My: d.calories,
      Average: avg?.avgCalories ?? null,
    };
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('ru-RU');
  };

  return (
    <main className={styles.main}>
      <div className={styles.topActions}>
        <Link href="/dashboard" className={styles.backLink}>
          &larr; К моим марафонам
        </Link>
        {streamId && (
          <Link
            href={`/dashboard/marathon/${streamId}?view=materials`}
            className={styles.materialsLink}
          >
            Материалы
          </Link>
        )}
      </div>

      <h1 className={styles.title}>{stream.title}</h1>
      <p className={styles.period}>
        {formatDate(stream.startDate)} — {formatDate(stream.endDate)} · {stream.durationDays} день
      </p>

      <div className={styles.cardGrid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Место</div>
          <div className={styles.cardValue}>
            {summary.rank !== null ? `${summary.rank} / ${summary.totalParticipants}` : '—'}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Потеря веса</div>
          <div className={styles.cardValue}>
            {summary.weightLossPercent > 0
              ? `−${summary.weightLossPercent}%`
              : `${summary.weightLossPercent}%`}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Вес: вход → сейчас</div>
          <div className={styles.cardValue}>
            {summary.entryWeight !== null && summary.currentWeight !== null
              ? `${summary.entryWeight} → ${summary.currentWeight} кг`
              : '—'}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Дисциплина</div>
          <div className={styles.cardValue}>
            {summary.disciplinePercent}%
            <span className={styles.cardSub}>
              ({summary.filledDays} / {stream.durationDays} дней)
            </span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Ср. калории / по потоку</div>
          <div className={styles.cardValue}>
            {summary.avgCalories}
            <span className={styles.cardSub}> / {summary.streamAvgCalories}</span>
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className={styles.chartSection}>
          <h2>Калории по дням</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" label={{ value: 'День', position: 'bottom', offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="My"
                name="Мои калории"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Average"
                name="Среднее по потоку"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className={styles.noData}>Нет данных для отображения.</p>
      )}

      {participant.dailyWeights.length > 0 ? (
        <div className={styles.chartSection}>
          <h2>Вес по дням</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={participant.dailyWeights}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" label={{ value: 'День', position: 'bottom', offset: -5 }} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="weightKg"
                name="Вес"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </main>
  );
}
