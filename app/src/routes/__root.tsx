import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppHeader } from '@/components/AppHeader';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: 480,
        margin: '0 auto',
        background: '#f6f8fa',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppHeader />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #d1d9e0',
          textAlign: 'center',
          fontSize: 12.5,
          color: '#59636e',
        }}
      >
        Built with <span style={{ color: '#E31337' }}>♥</span> by the{' '}
        <a
          href="https://ecency.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#b90f2e', fontWeight: 600 }}
        >
          Ecency
        </a>{' '}
        team
      </footer>
    </div>
  );
}
