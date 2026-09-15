import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  const { t } = useTranslation();
  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('about.about')} Hivesigner
      </h1>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#59636e' }}>
        {t('index.description')}
      </p>

      <div
        style={{
          marginTop: 4,
          padding: 16,
          background: '#fff',
          border: '1px solid #d1d9e0',
          borderRadius: 12,
          fontSize: 14,
          color: '#1f2328',
          textAlign: 'center',
        }}
      >
        <div>
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
        </div>
      </div>
    </section>
  );
}
