import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCookie } from '@/lib/cookies';

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
    const role = getCookie('mp_role');
    if (role !== 'mentor') {
      router.push('/login');
      return;
    }

    async function load() {
      try {
        const res = await fetch('/api/streams/my', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load streams');
        }
        setStreams(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Streams</h1>
        <Link href="/mentor/streams/launch">
          <button style={{ padding: '0.5rem 1rem' }}>Launch New Stream</button>
        </Link>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && streams.length === 0 && (
        <p style={{ marginTop: '1rem' }}>You have not launched any streams yet.</p>
      )}
      {!loading && !error && streams.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {streams.map((stream) => (
            <li
              key={stream.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <Link href={`/mentor/streams/${stream.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2 style={{ margin: '0 0 0.5rem' }}>{stream.template?.title || 'Untitled Stream'}</h2>
              </Link>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Start date:</strong> {new Date(stream.startDate).toLocaleDateString()}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Duration:</strong> {stream.template?.durationDays} days
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Status:</strong> {stream.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
