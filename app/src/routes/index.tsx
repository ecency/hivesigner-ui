import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const { t } = useTranslation();
  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('index.title')}
      </h1>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#59636e' }}>
        {t('index.secure_way_sign_in')}
      </p>
      <Link
        to="/about"
        style={{
          alignSelf: 'flex-start',
          height: 44,
          padding: '0 18px',
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 8,
          background: '#E31337',
          color: '#fff',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        {t('index.get_started')}
      </Link>
    </section>
  );
}
