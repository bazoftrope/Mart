import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

type Participant = {
  id: string;
  name: string;
  email: string;
};

type Enrollment = {
  id: string;
  enrolledAt: string;
  participant: Participant | null;
};

type StreamDetails = {
  id: string;
  startDate: string;
  status: string;
  createdAt: string;
  enrollmentsCount: number;
  template: {
    id: string;
    title: string;
    description?: string;
    durationDays: number;
  } | null;
};

export default function MentorStreamDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [stream, setStream] = useState<StreamDetails | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'mentor') {
      router.push('/login');
      return;
    }
    if (!id) return;

    async function load() {
      try {
        const [streamRes, enrollmentsRes] = await Promise.all([
          fetch(`/api/streams/${id}`, { credentials: 'include' }),
          fetch(`/api/streams/${id}/enrollments`, { credentials: 'include' }),
        ]);

        const streamJson = await streamRes.json().catch(() => ({}));
        const enrollmentsJson = await enrollmentsRes.json().catch(() => ({}));

        if (!streamRes.ok) {
          throw new Error(streamJson.message || streamJson.error || 'Failed to load stream');
        }
        if (!enrollmentsRes.ok) {
          throw new Error(enrollmentsJson.message || enrollmentsJson.error || 'Failed to load enrollments');
        }

        setStream(streamJson.data);
        setEnrollments(enrollmentsJson.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

  if (loading) return <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}><p>Loading...</p></main>;
  if (error) return <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}><p style={{ color: 'red' }}>{error}</p></main>;
  if (!stream) return <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}><p>Stream not found</p></main>;

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <Link href="/mentor/streams" style={{ color: '#1a1a2e' }}>← Back to my streams</Link>
      <h1 style={{ marginTop: '1rem' }}>{stream.template?.title || 'Stream'}</h1>
      <p style={{ marginTop: '0.5rem', color: '#555' }}>
        {stream.template?.description || 'No description'}
      </p>

      <div style={{ marginTop: '1.5rem', lineHeight: 1.8 }}>
        <p><strong>Duration:</strong> {stream.template?.durationDays} days</p>
        <p><strong>Start date:</strong> {new Date(stream.startDate).toLocaleDateString()}</p>
        <p><strong>Status:</strong> {stream.status}</p>
        <p><strong>Total participants:</strong> {stream.enrollmentsCount}</p>
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h2>Participants</h2>
        {enrollments.length === 0 && <p>No participants yet.</p>}
        {enrollments.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
            {enrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: '1rem',
                  marginBottom: '0.75rem',
                }}
              >
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Name:</strong> {enrollment.participant?.name || 'Unknown'}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Email:</strong> {enrollment.participant?.email || 'Unknown'}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Enrolled:</strong>{' '}
                  {new Date(enrollment.enrolledAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
