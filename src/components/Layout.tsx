import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getCookie, deleteCookie } from '@/lib/cookies';

type UserRole = 'admin' | 'mentor' | 'participant' | undefined;

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawRole = getCookie('mp_role');
    if (rawRole === 'admin' || rawRole === 'mentor' || rawRole === 'participant') {
      setRole(rawRole);
    } else {
      setRole(undefined);
    }
    setLoading(false);
  }, [router.asPath]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      deleteCookie('mp_access_token');
      deleteCookie('mp_refresh_token');
      deleteCookie('mp_role');
      setRole(undefined);
      window.location.href = '/';
    }
  }

  function renderNav() {
    if (loading) return null;

    if (!role) {
      return (
        <>
          <Link href="/login" style={linkStyle}>
            Login
          </Link>
          <Link href="/register" style={linkStyle}>
            Register
          </Link>
        </>
      );
    }

    if (role === 'admin') {
      return (
        <>
          <Link href="/admin" style={linkStyle}>
            Pending Review
          </Link>
          <button onClick={handleLogout} style={buttonStyle}>
            Logout
          </button>
        </>
      );
    }

    if (role === 'mentor') {
      return (
        <>
          <Link href="/mentor" style={linkStyle}>
            Dashboard
          </Link>
          <Link href="/mentor/templates" style={linkStyle}>
            My Templates
          </Link>
          <Link href="/mentor/templates/new" style={linkStyle}>
            Create Template
          </Link>
          <Link href="/mentor/streams" style={linkStyle}>
            My Streams
          </Link>
          <button onClick={handleLogout} style={buttonStyle}>
            Logout
          </button>
        </>
      );
    }

    // role === 'participant'
    return (
      <>
        <Link href="/dashboard" style={linkStyle}>
          My Marathons
        </Link>
        <button onClick={handleLogout} style={buttonStyle}>
          Logout
        </button>
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={headerStyle}>
        <div style={containerStyle}>
          <Link href="/" style={logoStyle}>
            Marathon Platform
          </Link>
          <nav style={navStyle}>{renderNav()}</nav>
        </div>
      </header>
      <main style={mainStyle}>{children}</main>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  color: '#fff',
  padding: '0 1rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 56,
};

const logoStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '1.25rem',
  fontWeight: 'bold',
  textDecoration: 'none',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
};

const linkStyle: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  fontSize: '0.95rem',
};

const buttonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #fff',
  color: '#fff',
  padding: '0.35rem 0.75rem',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.95rem',
};

const mainStyle: React.CSSProperties = {
  paddingTop: '1.5rem',
};
