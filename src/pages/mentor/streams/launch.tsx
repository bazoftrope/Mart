import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

type Template = {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
  status: string;
};

export default function LaunchStreamPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'mentor') {
      router.push('/login');
      return;
    }

    async function loadTemplates() {
      try {
        const res = await fetch('/api/marathons', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load templates');
        }
        const approved = (json.data || []).filter((t: Template) => t.status === 'approved');
        setTemplates(approved);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ templateId: selectedTemplateId, startDate }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to launch stream');
      }

      router.push('/mentor/streams');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
      <Link href="/mentor/streams" style={{ color: '#1a1a2e' }}>← Back to streams</Link>
      <h1 style={{ marginTop: '1rem' }}>Launch New Stream</h1>

      {loading && <p>Loading templates...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && templates.length === 0 && (
        <p style={{ marginTop: '1rem' }}>
          You have no approved templates. Create and submit a template for admin review first.
        </p>
      )}

      {!loading && templates.length > 0 && (
        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="template">Marathon Template</label>
            <select
              id="template"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title} ({template.durationDays} days)
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.75rem' }}>
            {submitting ? 'Launching...' : 'Launch Stream'}
          </button>
        </form>
      )}
    </main>
  );
}
