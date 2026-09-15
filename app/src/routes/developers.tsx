import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

// Developer docs pointers. Static links; the app registration itself is done on
// the profile page (account_update2 with the app's redirect_uris).
export const Route = createFileRoute('/developers')({
  component: Developers,
});

const card = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
  padding: 16,
} as const;

function Developers() {
  const { t } = useTranslation();
  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('developers.developers')}
      </h1>

      <p style={{ margin: 0, fontSize: 14, color: '#59636e' }}>
        Full documentation is at{' '}
        <a
          href="https://docs.hivesigner.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#b90f2e', fontWeight: 600 }}
        >
          docs.hivesigner.com
        </a>
        .
      </p>

      <div
        style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <div style={{ fontWeight: 600 }}>{t('developers.1.title')}</div>
        <p
          style={{ margin: 0, fontSize: 13, color: '#59636e', lineHeight: 1.5 }}
        >
          Create a Hive account for your app, then set its type to "application"
          and register your redirect URIs on the profile page.
        </p>
      </div>

      <div
        style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <div style={{ fontWeight: 600 }}>{t('developers.3.title')}</div>
        <p
          style={{ margin: 0, fontSize: 13, color: '#59636e', lineHeight: 1.5 }}
        >
          Integrate with the official SDK:{' '}
          <a
            href="https://github.com/ecency/hivesigner.js"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#b90f2e' }}
          >
            hivesigner.js
          </a>
          .
        </p>
      </div>
    </section>
  );
}
