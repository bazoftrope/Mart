import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import CalendarGrid from '@/components/CalendarGrid';

type StreamCalendar = {
  stream: {
    id: string;
    startDate: string;
    status: string;
    template: {
      id: string;
      title: string;
      description?: string;
      durationDays: number;
    };
  };
  currentDayNumber: number;
  reports: Array<{ id: string; dayNumber: number; totalCalories: number; filledAt: Date | string }>;
};

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

    async function load() {
      try {
        const res = await fetch(`/api/streams/${streamId}/calendar`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load calendar');
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
        <p style={{ color: 'red' }}>{error || 'Failed to load calendar'}</p>
      </main>
    );
  }

  const { stream, currentDayNumber, reports } = data;

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <Link href="/dashboard" style={{ color: '#1a1a2e' }}>
        ← Back to my marathons
      </Link>

      <h1 style={{ marginTop: '1rem' }}>{stream.template.title}</h1>
      <p style={{ color: '#555', marginTop: '0.5rem' }}>
        {stream.template.description || 'No description'}
      </p>

      <div style={{ marginTop: '1.5rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
        <p>
          <strong>Duration:</strong> {stream.template.durationDays} days
        </p>
        <p>
          <strong>Start date:</strong>{' '}
          {new Date(stream.startDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Status:</strong> {stream.status}
        </p>
        <p>
          <strong>Current day:</strong>{' '}
          {currentDayNumber > 0 ? currentDayNumber : 'Not started yet'}
        </p>
      </div>

      <CalendarGrid
        streamId={stream.id}
        durationDays={stream.template.durationDays}
        currentDayNumber={currentDayNumber}
        reports={reports}
      />
    </main>
  );
}
