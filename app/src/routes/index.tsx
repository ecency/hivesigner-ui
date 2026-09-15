import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAccounts } from '@/lib/use-accounts';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const { t } = useTranslation();
  const { usernames } = useAccounts();
  // Get started should start something: send a first-time visitor to key import
  // and a returning one to their accounts. It used to open /about, an info page,
  // which left the landing screen with no route into the app at all.
  const primary = usernames.length > 0 ? '/accounts' : '/import';
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
        to={primary}
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
      <nav
        style={{ display: 'flex', gap: 14, fontSize: 13.5, flexWrap: 'wrap' }}
      >
        <Link to="/accounts">{t('footer.accounts')}</Link>
        <Link to="/apps">{t('footer.apps')}</Link>
        <Link to="/signmessage">{t('footer.sign_message')}</Link>
        <Link to="/about">{t('footer.about')}</Link>
      </nav>
    </section>
  );
}
