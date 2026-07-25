import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

type Template = {
  id: string;
  title: string;
  durationDays: number;
  status: 'draft' | 'pending_review' | 'approved';
};

type DayInput = {
  dayNumber: number;
  textContent: string;
  audioUrl: string;
  videoUrl: string;
};

function createEmptyDays(count: number): DayInput[] {
  return Array.from({ length: count }, (_, index) => ({
    dayNumber: index + 1,
    textContent: '',
    audioUrl: '',
    videoUrl: '',
  }));
}

export default function TemplateDaysPage() {
  const router = useRouter();
  const { id } = router.query;
  const templateId = typeof id === 'string' ? id : undefined;

  const [template, setTemplate] = useState<Template | null>(null);
  const [days, setDays] = useState<DayInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
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

        const data: Template & { days: DayInput[] } = json.data;
        setTemplate(data);

        if (data.days && data.days.length > 0) {
          setDays(data.days);
        } else {
          setDays(createEmptyDays(data.durationDays));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, templateId]);

  function updateDay(index: number, field: keyof DayInput, value: string | number) {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!templateId) return;

    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/marathons/${templateId}/days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ days }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to save days');
      }

      alert('Days saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!templateId) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/marathons/${templateId}/submit`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to submit template');
      }

      router.push('/mentor/templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (error && !template) {
    return (
      <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <Link href="/mentor/templates">
          <button>Back to Templates</button>
        </Link>
      </main>
    );
  }

  if (!template) {
    return (
      <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        <p>Template not found.</p>
      </main>
    );
  }

  const isEditable = template.status === 'draft';

  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Days: {template.title}</h1>
      <p>
        Duration: {template.durationDays} days. Fill in the content for each day.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSave}>
        {days.map((day, index) => (
          <fieldset
            key={index}
            style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <legend>Day {day.dayNumber}</legend>
            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor={`text-${index}`}>Text Content</label>
              <textarea
                id={`text-${index}`}
                value={day.textContent}
                onChange={(e) => updateDay(index, 'textContent', e.target.value)}
                rows={6}
                disabled={!isEditable}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor={`audio-${index}`}>Audio URL</label>
              <input
                id={`audio-${index}`}
                type="url"
                value={day.audioUrl}
                onChange={(e) => updateDay(index, 'audioUrl', e.target.value)}
                disabled={!isEditable}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label htmlFor={`video-${index}`}>Video URL</label>
              <input
                id={`video-${index}`}
                type="url"
                value={day.videoUrl}
                onChange={(e) => updateDay(index, 'videoUrl', e.target.value)}
                disabled={!isEditable}
                style={{ width: '100%' }}
              />
            </div>
          </fieldset>
        ))}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          {isEditable && (
            <>
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Days'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                style={{ background: '#27ae60', color: '#fff' }}
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </>
          )}
          <Link href="/mentor/templates">
            <button type="button">Back to Templates</button>
          </Link>
        </div>
      </form>
    </main>
  );
}
