import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { PublicUser } from '@/types/auth';

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

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export default function AdminPendingPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PendingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const role = getCookie('mp_role');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }

    async function load() {
      try {
        const res = await fetch('/api/admin/pending', {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load pending templates');
        }

        setTemplates(json.data || []);
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
      <h1>Admin — Pending Marathon Templates</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && templates.length === 0 && (
        <p>No templates are pending review.</p>
      )}
      {!loading && !error && templates.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {templates.map((template) => (
            <li
              key={template.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <Link href={`/admin/${template.id}`} style={{ textDecoration: 'none' }}>
                <h2 style={{ margin: '0 0 0.5rem' }}>{template.title}</h2>
              </Link>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Mentor:</strong>{' '}
                {template.mentor ? template.mentor.name : 'Unknown'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Duration:</strong> {template.durationDays} days
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Submitted:</strong>{' '}
                {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
