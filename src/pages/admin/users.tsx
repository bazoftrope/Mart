import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { PublicUser } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('');

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
        const params = new URLSearchParams();
        if (filterRole) params.set('role', filterRole);

        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || json.error || 'Failed to load users');
        }

        setUsers(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, filterRole]);

  function getRoleBadgeStyle(role: string) {
    switch (role) {
      case 'admin':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      case 'mentor':
        return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'participant':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Admin — Users</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="role-filter" style={{ marginRight: '0.5rem' }}>
          Filter by role:
        </label>
        <select
          id="role-filter"
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setLoading(true);
          }}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="mentor">Mentor</option>
          <option value="participant">Participant</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && users.length === 0 && (
        <p>No users found.</p>
      )}
      {!loading && !error && users.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {users.map((user) => (
            <li
              key={user.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <Link
                  href={`/admin/users/${user.id}`}
                  style={{ textDecoration: 'none', fontWeight: 'bold' }}
                >
                  {user.name}
                </Link>
                <p style={{ margin: '0.25rem 0 0', color: '#666' }}>{user.email}</p>
              </div>
              <span
                style={{
                  ...getRoleBadgeStyle(user.role),
                  padding: '0.25rem 0.75rem',
                  borderRadius: 12,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                {user.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
