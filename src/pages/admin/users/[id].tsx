import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { PublicUser } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'admin') {
      router.push('/login');
      return;
    }

    async function loadCurrentUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setCurrentUserId(json.data?.id);
        }
      } catch {
        // Ignore - we'll just allow self-edit if we can't determine
      }
    }

    loadCurrentUser();
  }, [router]);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load user');
        }

        setUser(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleRoleChange(newRole: 'mentor' | 'participant') {
    if (!user) return;

    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to update role');
      }

      setUser(json.data);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const isSelf = currentUserId === user?.id;

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
      <Link href="/admin/users" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        &larr; Back to users
      </Link>

      <h1>User Details</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && !user && <p>User not found.</p>}

      {user && (
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: '1.5rem',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <strong>Name:</strong> {user.name}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Email:</strong> {user.email}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Timezone:</strong> {user.timezone}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Current Role:</strong>{' '}
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 12,
                fontSize: '0.85rem',
                fontWeight: 500,
                backgroundColor:
                  user.role === 'admin'
                    ? '#fee2e2'
                    : user.role === 'mentor'
                    ? '#dbeafe'
                    : '#dcfce7',
                color:
                  user.role === 'admin'
                    ? '#991b1b'
                    : user.role === 'mentor'
                    ? '#1e40af'
                    : '#166534',
              }}
            >
              {user.role}
            </span>
          </div>

          {user.role !== 'admin' && !isSelf && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <strong>Change Role:</strong>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                {user.role !== 'mentor' && (
                  <button
                    onClick={() => handleRoleChange('mentor')}
                    disabled={saving}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    Make Mentor
                  </button>
                )}
                {user.role !== 'participant' && (
                  <button
                    onClick={() => handleRoleChange('participant')}
                    disabled={saving}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    Make Participant
                  </button>
                )}
              </div>
            </div>
          )}

          {isSelf && (
            <p style={{ marginTop: '1rem', color: '#666', fontStyle: 'italic' }}>
              You cannot change your own role.
            </p>
          )}

          {saveError && (
            <p style={{ marginTop: '0.5rem', color: 'red' }}>{saveError}</p>
          )}
        </div>
      )}
    </main>
  );
}
