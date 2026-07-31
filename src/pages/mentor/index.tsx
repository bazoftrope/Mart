import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import styles from './MentorDashboard.module.css';

export default function MentorDashboard() {
  const router = useRouter();

  useEffect(() => {
    const initAuth = useAuthStore.getState().initAuth;
    initAuth();
    const role = useAuthStore.getState().role;
    if (role !== 'mentor') {
      router.push('/login');
    }
  }, [router]);

  return (
    <main className={styles.main}>
      <h1>Панель ментора</h1>
      <nav className={styles.nav}>
        <Link href="/mentor/templates">
          <button className={styles.navBtn}>
            Мои шаблоны марафонов
          </button>
        </Link>
        <Link href="/mentor/templates/new">
          <button className={styles.navBtn}>
            Создать шаблон
          </button>
        </Link>
      </nav>
    </main>
  );
}
