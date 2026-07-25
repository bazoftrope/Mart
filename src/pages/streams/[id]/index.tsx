import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCookie } from '@/lib/cookies';

type StreamDetails = {
  id: string;
  startDate: string;
  status: string;
  createdAt: string;
  enrollmentsCount: number;
  isEnrolled: boolean;
  template: {
    id: string;
    title: string;
    description?: string;
    durationDays: number;
    status: string;
  } | null;
  mentor: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export default function StreamPage() {
  const router = useRouter();
  const { id } = router.query;

  const [stream, setStream] = useState<StreamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    setRole(getCookie('mp_role'));
  }, []);

  useEffect(() => {
    if (!id) return;

    async function loadStream() {
      try {
        const res = await fetch(`/api/streams/${id}`, { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load stream');
        }
        setStream(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    loadStream();
  }, [id]);

  async function handleEnroll() {
    if (!stream) return;
    setEnrolling(true);
    setError(null);

    try {
      const res = await fetch(`/api/streams/${stream.id}/enroll`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Enrollment failed');
      }

      setStream({ ...stream, isEnrolled: true, enrollmentsCount: stream.enrollmentsCount + 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) return <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}><p>Loading...</p></main>;
  if (error) return <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!stream) return <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}><p>Stream not found</p></main>;

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <Link href="/" style={{ color: '#1a1a2e' }}>← Back to streams</Link>
      <h1 style={{ marginTop: '1rem' }}>{stream.template?.title || 'Stream'}</h1>
      <p style={{ marginTop: '0.5rem', color: '#555' }}>
        {stream.template?.description || 'No description'}
      </p>

      <div style={{ marginTop: '1.5rem', lineHeight: 1.8 }}>
        <p><strong>Duration:</strong> {stream.template?.durationDays} days</p>
        <p><strong>Start date:</strong> {new Date(stream.startDate).toLocaleDateString()}</p>
        <p><strong>Status:</strong> {stream.status}</p>
        <p><strong>Mentor:</strong> {stream.mentor?.name || 'Unknown'}</p>
        <p><strong>Participants:</strong> {stream.enrollmentsCount}</p>
      </div>

      {role === 'participant' && (
        <div style={{ marginTop: '1.5rem' }}>
          {stream.isEnrolled ? (
            <button disabled style={{ padding: '0.75rem 1.5rem' }}>
              You are enrolled
            </button>
          ) : stream.status === 'finished' ? (
            <button disabled style={{ padding: '0.75rem 1.5rem' }}>
              Stream finished
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              {enrolling ? 'Enrolling...' : 'Enroll in this stream'}
            </button>
          )}
        </div>
      )}

      {role !== 'participant' && role !== undefined && (
        <p style={{ marginTop: '1.5rem', color: '#777' }}>
          Only participants can enroll in streams.
        </p>
      )}

      {role === undefined && (
        <p style={{ marginTop: '1.5rem' }}>
          <Link href="/login">Login</Link> or <Link href="/register">register</Link> to enroll.
        </p>
      )}
    </main>
  );
}
