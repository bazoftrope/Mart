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

type ResultsData = {
  participant: {
    dailyCalories: Array<{ day: number; calories: number }>;
    avgCalories: number;
    totalDays: number;
  };
  streamAverage: Array<{ day: number; avgCalories: number }>;
  summary: {
    rank: number | null;
    disciplinePercent: number;
    filledDays: number;
    avgCalories: number;
    totalParticipants: number;
  };
};

export default function ResultsPage() {
  const router = useRouter();
  const { streamId } = router.query;

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
        const res = await fetch(`/api/streams/${streamId}/results`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load results');
        }
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [streamId]);

  if (loading) {
    return (
      <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
        <p style={{ color: 'red' }}>{error || 'Failed to load results'}</p>
      </main>
    );
  }

  const { participant, streamAverage, summary } = data;

  // Merge data for the chart
  const chartData = participant.dailyCalories.map((d) => {
    const avg = streamAverage.find((a) => a.day === d.day);
    return {
      day: d.day,
      My: d.calories,
      Average: avg?.avgCalories ?? null,
    };
  });

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <Link href={`/dashboard/marathon/${streamId}`} style={{ color: '#1a1a2e' }}>
        &larr; Back to calendar
      </Link>

      <h1 style={{ marginTop: '1rem' }}>Results</h1>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        <div style={cardStyle}>
          <div style={cardLabel}>Rank</div>
          <div style={cardValue}>
            {summary.rank !== null ? `${summary.rank} / ${summary.totalParticipants}` : '—'}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardLabel}>Discipline</div>
          <div style={cardValue}>{summary.disciplinePercent}%</div>
        </div>
        <div style={cardStyle}>
          <div style={cardLabel}>Filled days</div>
          <div style={cardValue}>{summary.filledDays}</div>
        </div>
        <div style={cardStyle}>
          <div style={cardLabel}>Avg calories</div>
          <div style={cardValue}>{summary.avgCalories}</div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div style={{ marginTop: '2rem' }}>
          <h2>Calories per day</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" label={{ value: 'Day', position: 'bottom', offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="My"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Average"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p style={{ color: '#555', marginTop: '2rem' }}>No data to display yet.</p>
      )}
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '1rem',
  textAlign: 'center',
};

const cardLabel: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#6b7280',
  marginBottom: '0.25rem',
};

const cardValue: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 600,
  color: '#111827',
};
