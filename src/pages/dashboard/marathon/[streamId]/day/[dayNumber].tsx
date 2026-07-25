import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import ProductSearch, { type Product } from '@/components/ProductSearch';
import ReportTable, {
  type ReportLineItem,
  computeLineCalories,
} from '@/components/ReportTable';

type DayData = {
  streamId: string;
  dayNumber: number;
  currentDayNumber: number;
  isEditable: boolean;
  day: {
    textContent: string | null;
    audioUrl: string | null;
    videoUrl: string | null;
  } | null;
  report: {
    id: string;
    totalCalories: number;
    filledAt: string;
    updatedAt: string;
    lines: ReportLineItem[];
  } | null;
};

export default function DayPage() {
  const router = useRouter();
  const { streamId, dayNumber } = router.query;

  const [data, setData] = useState<DayData | null>(null);
  const [lines, setLines] = useState<ReportLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    if (!streamId || !dayNumber) return;

    async function load() {
      try {
        const res = await fetch(
          `/api/streams/${streamId}/day/${dayNumber}`,
          { credentials: 'include' }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load day');
        }
        setData(json.data);
        setLines(json.data.report?.lines || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [streamId, dayNumber]);

  function handleAddProduct(product: Product) {
    const exists = lines.some((line) => line.productId === product.id);
    if (exists) {
      setSaveError('This product is already in the report');
      return;
    }

    const newLine: ReportLineItem = {
      productId: product.id,
      name: product.name,
      calories: product.calories,
      weightGrams: 100,
      lineCalories: computeLineCalories(100, product.calories),
    };
    setLines((prev) => [...prev, newLine]);
    setSaveError(null);
  }

  async function handleSave() {
    if (!data || lines.length === 0) return;

    setSaving(true);
    setSaveError(null);

    const payload = {
      lines: lines.map((line) => ({
        productId: line.productId,
        weightGrams: line.weightGrams,
      })),
    };

    try {
      const url = data.report
        ? `/api/reports/${data.report.id}`
        : `/api/streams/${streamId}/day/${dayNumber}`;
      const method = data.report ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to save report');
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              report: {
                id: json.data.id,
                totalCalories: json.data.totalCalories,
                filledAt: json.data.filledAt,
                updatedAt: json.data.updatedAt,
                lines: json.data.lines,
              },
            }
          : null
      );
      setLines(json.data.lines);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

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
        <p style={{ color: 'red' }}>{error || 'Failed to load day'}</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <Link
        href={`/dashboard/marathon/${streamId}`}
        style={{ color: '#1a1a2e' }}
      >
        ← Back to calendar
      </Link>

      <h1 style={{ marginTop: '1rem' }}>Day {data.dayNumber}</h1>

      {!data.isEditable && (
        <p style={{ color: '#856404', backgroundColor: '#fff3cd', padding: '0.75rem', borderRadius: 4 }}>
          This day is not yet available for editing.
        </p>
      )}

      {data.day && (
        <section style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
          {data.day.textContent && (
            <div
              style={{
                lineHeight: 1.7,
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: 8,
              }}
            >
              {data.day.textContent}
            </div>
          )}
          {data.day.audioUrl && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Audio:</strong>{' '}
              <a href={data.day.audioUrl} target="_blank" rel="noopener noreferrer">
                Listen
              </a>
            </div>
          )}
          {data.day.videoUrl && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Video:</strong>{' '}
              <a href={data.day.videoUrl} target="_blank" rel="noopener noreferrer">
                Watch
              </a>
            </div>
          )}
        </section>
      )}

      <section style={{ marginTop: '2rem' }}>
        <h2>Report</h2>

        {data.isEditable && (
          <div style={{ marginBottom: '1rem' }}>
            <ProductSearch onSelect={handleAddProduct} disabled={saving} />
          </div>
        )}

        <ReportTable
          lines={lines}
          onChange={setLines}
          readOnly={!data.isEditable}
        />

        {data.isEditable && (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={handleSave}
              disabled={saving || lines.length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                cursor: lines.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save report'}
            </button>
          </div>
        )}

        {saveError && (
          <p style={{ color: 'red', marginTop: '1rem' }}>{saveError}</p>
        )}

        {data.report && (
          <p style={{ marginTop: '1rem', color: '#555', fontSize: '0.9rem' }}>
            Last updated: {new Date(data.report.updatedAt).toLocaleString()}
          </p>
        )}
      </section>
    </main>
  );
}
