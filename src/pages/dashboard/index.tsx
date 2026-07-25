import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

type Enrollment = {
  id: string;
  enrolledAt: string;
  stream: {
    id: string;
    startDate: string;
    status: string;
    template: {
      id: string;
      title: string;
      description?: string;
      durationDays: number;
    } | null;
    mentor: {
      id: string;
      name: string;
      email: string;
    } | null;
  } | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    useAuthStore.getState().initAuth();
    const currentRole = useAuthStore.getState().role;
    if (currentRole !== 'participant') {
      router.push('/login');
      return;
    }

    async function load() {
      try {
        const res = await fetch('/api/streams/my', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load enrollments');
        }
        setEnrollments(json.data || []);
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
      <h1>My Marathons</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && enrollments.length === 0 && (
        <div style={{ marginTop: '1rem' }}>
          <p>You are not enrolled in any marathon yet.</p>
          <Link href="/">
            <button style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
              Browse open streams
            </button>
          </Link>
        </div>
      )}
      {!loading && !error && enrollments.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {enrollments.map((enrollment) => (
            <li
              key={enrollment.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <Link
                href={`/dashboard/marathon/${enrollment.stream?.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h2 style={{ margin: '0 0 0.5rem' }}>
                  {enrollment.stream?.template?.title || 'Unknown Marathon'}
                </h2>
              </Link>
              <p style={{ margin: '0.25rem 0', color: '#555' }}>
                {enrollment.stream?.template?.description || 'No description'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Mentor:</strong>{' '}
                {enrollment.stream?.mentor?.name || 'Unknown'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Start date:</strong>{' '}
                {enrollment.stream
                  ? new Date(enrollment.stream.startDate).toLocaleDateString()
                  : '-'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Status:</strong> {enrollment.stream?.status}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Enrolled:</strong>{' '}
                {new Date(enrollment.enrolledAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
