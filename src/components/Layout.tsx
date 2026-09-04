import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import styles from './Layout.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const initAuth = useAuthStore((s) => s.initAuth);
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
    setLoading(false);
  }, [router.asPath, initAuth]);

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  function renderNav() {
    if (loading) return null;

    if (!role) {
      return (
        <>
          <Link href="/login" className={styles.link}>
            Войти
          </Link>
          <Link href="/register" className={styles.link}>
            Регистрация
          </Link>
        </>
      );
    }

    if (role === 'admin') {
      return (
        <>
          <Link href="/admin" className={styles.link}>
            На проверку
          </Link>
          <Link href="/admin/users" className={styles.link}>
            Пользователи
          </Link>
          <button onClick={handleLogout} className={styles.button}>
            Выйти
          </button>
        </>
      );
    }

    if (role === 'mentor') {
      return (
        <>
          <Link href="/mentor" className={styles.link}>
            Панель
          </Link>
          <Link href="/mentor/templates" className={styles.link}>
            Мои шаблоны
          </Link>
          <Link href="/mentor/templates/new" className={styles.link}>
            Создать шаблон
          </Link>
          <Link href="/mentor/streams" className={styles.link}>
            Мои потоки
          </Link>
          <Link href="/mentor/messages" className={styles.link}>
            Сообщения
          </Link>
          <button onClick={handleLogout} className={styles.button}>
            Выйти
          </button>
        </>
      );
    }

    // role === 'participant'
    return (
      <>
        <Link href="/dashboard" className={styles.link}>
          Мои марафоны
        </Link>
        <Link href="/dashboard/messages" className={styles.link}>
          Сообщения
        </Link>
        <button onClick={handleLogout} className={styles.button}>
          Выйти
        </button>
      </>
    );
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo.png"
              alt="Marathon Platform"
              width={33}
              height={36}
              className={styles.logoImage}
            />
            <span>Marathon Platform</span>
          </Link>
          <nav className={styles.nav}>{renderNav()}</nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
