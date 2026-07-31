import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { PublicUser } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';
import styles from './AdminUserDetail.module.css';

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
          throw new Error(json.message || json.error || 'Не удалось загрузить пользователя');
        }

        setUser(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Что-то пошло не так');
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
        throw new Error(json.message || json.error || 'Не удалось обновить роль');
      }

      setUser(json.data);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setSaving(false);
    }
  }

  const isSelf = currentUserId === user?.id;

  return (
    <main className={styles.main}>
      <Link href="/admin/users" className={styles.backLink}>
        &larr; Назад к пользователям
      </Link>

      <h1>Детали пользователя</h1>

      {loading && <p>Загрузка...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && !user && <p>Пользователь не найден.</p>}

      {user && (
        <div className={styles.card}>
          <div className={styles.field}>
            <strong>Имя:</strong> {user.name}
          </div>
          <div className={styles.field}>
            <strong>Эл. почта:</strong> {user.email}
          </div>
          <div className={styles.field}>
            <strong>Часовой пояс:</strong> {user.timezone}
          </div>
          <div className={styles.field}>
            <strong>Текущая роль:</strong>{' '}
            <span
              className={styles.roleBadge}
              style={{
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
            <div className={styles.changeRoleSection}>
              <strong>Сменить роль:</strong>
              <div className={styles.buttonGroup}>
                {user.role !== 'mentor' && (
                  <button
                    onClick={() => handleRoleChange('mentor')}
                    disabled={saving}
                    className={`${styles.actionBtn} ${styles.btnMentor}`}
                  >
                    Сделать ментором
                  </button>
                )}
                {user.role !== 'participant' && (
                  <button
                    onClick={() => handleRoleChange('participant')}
                    disabled={saving}
                    className={`${styles.actionBtn} ${styles.btnParticipant}`}
                  >
                    Сделать участником
                  </button>
                )}
              </div>
            </div>
          )}

          {isSelf && (
            <p className={styles.selfNote}>
              Вы не можете изменить свою собственную роль.
            </p>
          )}

          {saveError && (
            <p className={styles.saveError}>{saveError}</p>
          )}
        </div>
      )}
    </main>
  );
}
