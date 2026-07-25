import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { PublicUser } from '@/types/auth';

type TemplateDay = {
  id: string;
  dayNumber: number;
  textContent?: string;
  audioUrl?: string;
  videoUrl?: string;
};

type TemplateDetail = {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  mentor: PublicUser | null;
  days: TemplateDay[];
};

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export default function AdminReviewTemplatePage() {
  const router = useRouter();
  const { id } = router.query;
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const role = getCookie('mp_role');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }

    if (!id || typeof id !== 'string') return;

    async function load() {
      try {
        const res = await fetch(`/api/admin/pending/${id}`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load template');
        }

        setTemplate(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

  async function handleApprove() {
    if (!template || typeof id !== 'string') return;

    setApproving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to approve template');
      }

      setApproved(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setApproving(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <p>
        <Link href="/admin">← Back to pending list</Link>
      </p>
      <h1>Review Template</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !template && !error && <p>Template not found.</p>}
      {template && (
        <>
          <section style={{ marginBottom: '1.5rem' }}>
            <h2>{template.title}</h2>
            {template.description && <p>{template.description}</p>}
            <p>
              <strong>Duration:</strong> {template.durationDays} days
            </p>
            <p>
              <strong>Mentor:</strong>{' '}
              {template.mentor
                ? `${template.mentor.name} (${template.mentor.email})`
                : 'Unknown'}
            </p>
            <p>
              <strong>Status:</strong> {template.status}
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h3>Days</h3>
            {template.days.length === 0 && <p>No days configured.</p>}
            {template.days.map((day) => (
              <article
                key={day.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <h4 style={{ marginTop: 0 }}>Day {day.dayNumber}</h4>
                {day.textContent ? (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{day.textContent}</p>
                ) : (
                  <p style={{ color: '#666' }}>No content</p>
                )}
                {day.audioUrl && (
                  <p>
                    <a href={day.audioUrl} target="_blank" rel="noreferrer">
                      Audio
                    </a>
                  </p>
                )}
                {day.videoUrl && (
                  <p>
                    <a href={day.videoUrl} target="_blank" rel="noreferrer">
                      Video
                    </a>
                  </p>
                )}
              </article>
            ))}
          </section>

          {approved ? (
            <p style={{ color: 'green', fontWeight: 'bold' }}>
              Template approved. Redirecting...
            </p>
          ) : (
            <button
              onClick={handleApprove}
              disabled={approving}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              {approving ? 'Approving...' : 'Approve Template'}
            </button>
          )}
        </>
      )}
    </main>
  );
}
