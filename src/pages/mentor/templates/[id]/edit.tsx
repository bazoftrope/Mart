import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

type Template = {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
  status: 'draft' | 'pending_review' | 'approved';
};

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export default function EditTemplatePage() {
  const router = useRouter();
  const { id } = router.query;
  const templateId = typeof id === 'string' ? id : undefined;

  const [template, setTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const role = getCookie('mp_role');
    if (role !== 'mentor') {
      router.push('/login');
      return;
    }

    if (!templateId) return;

    async function load() {
      try {
        const res = await fetch(`/api/marathons/${templateId}`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load template');
        }

        const data: Template = json.data;
        setTemplate(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setDurationDays(data.durationDays);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, templateId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!templateId) return;

    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/marathons/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, description, durationDays }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to update template');
      }

      router.push('/mentor/templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <Link href="/mentor/templates">
          <button>Back to Templates</button>
        </Link>
      </main>
    );
  }

  if (!template) {
    return (
      <main style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
        <p>Template not found.</p>
      </main>
    );
  }

  const isEditable = template.status === 'draft';

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Edit Marathon Template</h1>
      {!isEditable && (
        <p style={{ color: '#c0392b' }}>
          This template is {template.status === 'approved' ? 'approved' : 'pending review'} and cannot be edited.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={255}
            disabled={!isEditable}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={!isEditable}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="durationDays">Duration (days)</label>
          <input
            id="durationDays"
            type="number"
            min={1}
            max={365}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            required
            disabled={!isEditable}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={saving || !isEditable}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/mentor/templates">
            <button type="button">Cancel</button>
          </Link>
        </div>
      </form>
    </main>
  );
}
