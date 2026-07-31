import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { PublicUser } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';
import styles from './AdminUsers.module.css';

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
          throw new Error(json.message || json.error || 'Не удалось загрузить пользователей');
        }

        setUsers(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
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
    <main className={styles.main}>
      <h1>Админ — пользователи</h1>

      <div className={styles.filterDiv}>
        <label htmlFor="role-filter" className={styles.filterLabel}>
          Фильтр по роли:
        </label>
        <select
          id="role-filter"
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setLoading(true);
          }}
          className={styles.filterSelect}
        >
          <option value="">Все роли</option>
          <option value="admin">Админ</option>
          <option value="mentor">Ментор</option>
          <option value="participant">Участник</option>
        </select>
      </div>

      {loading && <p>Загрузка...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && users.length === 0 && (
        <p>Пользователи не найдены.</p>
      )}
      {!loading && !error && users.length > 0 && (
        <ul className={styles.list}>
          {users.map((user) => (
            <li
              key={user.id}
              className={styles.listItem}
            >
              <div>
                <Link
                  href={`/admin/users/${user.id}`}
                  className={styles.userLink}
                >
                  {user.name}
                </Link>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
              <span
                style={{
                  ...getRoleBadgeStyle(user.role),
                }}
                className={styles.roleBadge}
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
