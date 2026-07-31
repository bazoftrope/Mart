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
          throw new Error(json.message || json.error || 'Не удалось загрузить записи');
        }
        setEnrollments(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  return (
    <main className="container">
      <h1 className="pageTitle">Мои марафоны</h1>

      {loading && <p>Загрузка...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && enrollments.length === 0 && (
        <div className="mt-1">
          <p>Вы ещё не записаны ни на один марафон.</p>
          <Link href="/">
            <button className="btn btnPrimary mt-1">
              Посмотреть открытые потоки
            </button>
          </Link>
        </div>
      )}
      {!loading && !error && enrollments.length > 0 && (
        <ul className="listPlain mt-1">
          {enrollments.map((enrollment) => (
            <li key={enrollment.id} className="card">
              <Link
                href={`/dashboard/marathon/${enrollment.stream?.id}`}
                className="cardLink"
              >
                <h2 className="cardTitle">
                  {enrollment.stream?.template?.title || 'Неизвестный марафон'}
                </h2>
              </Link>
              <p className="meta textSecondary">
                {enrollment.stream?.template?.description || 'Нет описания'}
              </p>
              <p className="meta">
                <strong>Ментор:</strong>{' '}
                {enrollment.stream?.mentor?.name || 'Неизвестно'}
              </p>
              <p className="meta">
                <strong>Дата начала:</strong>{' '}
                {enrollment.stream
                  ? new Date(enrollment.stream.startDate).toLocaleDateString()
                  : '-'}
              </p>
              <p className="meta">
                <strong>Статус:</strong> {enrollment.stream?.status}
              </p>
              <p className="meta">
                <strong>Записан:</strong>{' '}
                {new Date(enrollment.enrolledAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
