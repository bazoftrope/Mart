import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { PublicUser } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/apiClient';

type PendingTemplate = {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  mentor: PublicUser | null;
};

export default function AdminPendingPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PendingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'admin') {
      router.push('/login');
      return;
    }

    async function load() {
      try {
        const res = await apiFetch('/api/admin/pending', {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Не удалось загрузить шаблоны на проверке');
        }

        setTemplates(json.data || []);
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
      <h1 className="pageTitle">Админ — шаблоны на проверке</h1>
      {loading && <p>Загрузка...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && templates.length === 0 && (
        <p>Нет шаблонов на проверке.</p>
      )}
      {!loading && !error && templates.length > 0 && (
        <ul className="listPlain">
          {templates.map((template) => (
            <li key={template.id} className="card">
              <Link href={`/admin/${template.id}`} className="cardLink">
                <h2 className="cardTitle">{template.title}</h2>
              </Link>
              <p className="meta">
                <strong>Ментор:</strong>{' '}
                {template.mentor ? template.mentor.name : 'Неизвестно'}
              </p>
              <p className="meta">
                <strong>Длительность:</strong> {template.durationDays} дн.
              </p>
              <p className="meta">
                <strong>Отправлен:</strong>{' '}
                {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
