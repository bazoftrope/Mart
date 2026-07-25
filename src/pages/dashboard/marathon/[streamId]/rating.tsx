import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

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
          throw new Error(json.message || json.error || 'Failed to load rating');
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
        <p style={{ color: 'red' }}>{error || 'Failed to load rating'}</p>
      </main>
    );
  }

  const { ratings } = data;

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <Link href={`/dashboard/marathon/${streamId}`} style={{ color: '#1a1a2e' }}>
        &larr; Back to calendar
      </Link>

      <h1 style={{ marginTop: '1rem' }}>Rating</h1>

      {ratings.length === 0 ? (
        <p style={{ color: '#555', marginTop: '1rem' }}>No ratings calculated yet.</p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '1.5rem',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 0.5rem' }}>#</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Participant</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Filled days</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Discipline</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map((entry) => {
              const isMe = entry.participantId === userId;
              return (
                <tr
                  key={entry.participantId}
                  style={{
                    borderBottom: '1px solid #eee',
                    backgroundColor: isMe ? '#f0f7ff' : undefined,
                    fontWeight: isMe ? 600 : undefined,
                  }}
                >
                  <td style={{ padding: '0.75rem 0.5rem' }}>{entry.rank}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    {entry.participantName}
                    {isMe && ' (you)'}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{entry.filledDays}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{entry.disciplinePercent}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
