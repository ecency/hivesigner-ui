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
    </div>
  );
}
