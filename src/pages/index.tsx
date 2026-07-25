import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCookie } from '@/lib/cookies';

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
  const [role, setRole] = useState<string | undefined>(undefined);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRole(getCookie('mp_role'));

    async function loadStreams() {
      try {
        const res = await fetch('/api/streams');
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

    loadStreams();
  }, []);

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Welcome to Marathon Platform</h1>
      <p style={{ marginTop: '1rem', lineHeight: 1.6 }}>
        A platform for healthy-eating marathons. Mentors create marathon
        templates, admins review them, and participants join streams to track
        their daily meals and progress.
      </p>

      {!role && (
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <Link href="/login">
            <button style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Login
            </button>
          </Link>
          <Link href="/register">
            <button style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Register
            </button>
          </Link>
        </div>
      )}

      <section style={{ marginTop: '2.5rem' }}>
        <h2>Open Streams</h2>
        {loading && <p>Loading streams...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && streams.length === 0 && (
          <p>No open streams available right now.</p>
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
                <Link href={`/streams/${stream.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ margin: '0 0 0.5rem' }}>
                    {stream.template?.title || 'Untitled Stream'}
                  </h3>
                </Link>
                <p style={{ margin: '0.25rem 0', color: '#555' }}>
                  {stream.template?.description || 'No description'}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Duration:</strong> {stream.template?.durationDays} days
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Start date:</strong>{' '}
                  {new Date(stream.startDate).toLocaleDateString()}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Mentor:</strong> {stream.mentor?.name || 'Unknown'}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Status:</strong> {stream.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
