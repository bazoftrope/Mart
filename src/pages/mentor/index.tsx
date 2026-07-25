import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';

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
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Mentor Dashboard</h1>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <Link href="/mentor/templates">
          <button style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            My Marathon Templates
          </button>
        </Link>
        <Link href="/mentor/templates/new">
          <button style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            Create New Template
          </button>
        </Link>
      </nav>
    </main>
  );
}
