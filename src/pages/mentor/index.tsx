import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export default function MentorDashboard() {
  const router = useRouter();

  useEffect(() => {
    const role = getCookie('mp_role');
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
