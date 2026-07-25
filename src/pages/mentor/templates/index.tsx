import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

type Template = {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
  status: 'draft' | 'pending_review' | 'approved';
  createdAt: string;
  updatedAt: string;
};

function statusLabel(status: Template['status']): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'pending_review':
      return 'Pending Review';
    case 'approved':
      return 'Approved';
    default:
      return status;
  }
}

export default function MentorTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
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

    async function load() {
      try {
        const res = await fetch('/api/marathons', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load templates');
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

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this draft template?')) {
      return;
    }

    try {
      const res = await fetch(`/api/marathons/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to delete template');
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function handleSubmit(id: string) {
    try {
      const res = await fetch(`/api/marathons/${id}/submit`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to submit template');
      }

      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'pending_review' } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Marathon Templates</h1>
        <Link href="/mentor/templates/new">
          <button>Create Template</button>
        </Link>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && templates.length === 0 && <p>No templates yet.</p>}

      {!loading && templates.length > 0 && (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.5rem' }}>{template.title}</h2>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    {template.description || 'No description'}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Duration:</strong> {template.durationDays} days
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Status:</strong> {statusLabel(template.status)}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Link href={`/mentor/templates/${template.id}/edit`}>
                    <button style={{ width: '100%' }}>Edit</button>
                  </Link>
                  <Link href={`/mentor/templates/${template.id}/days`}>
                    <button style={{ width: '100%' }}>Days</button>
                  </Link>
                  {template.status === 'draft' && (
                    <>
                      <button onClick={() => handleSubmit(template.id)} style={{ width: '100%' }}>
                        Submit
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        style={{ width: '100%', background: '#c0392b', color: '#fff' }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
