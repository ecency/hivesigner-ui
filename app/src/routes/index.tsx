import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { btnPrimary, h1, muted, page } from '@/components/ui';
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
    <section className={page}>
      <h1 className={h1}>{t('index.title')}</h1>
      {/* Capped so the line length stays readable once the shell widens. */}
      <p className={`${muted} m-0 max-w-2xl leading-normal`}>
        {t('index.secure_way_sign_in')}
      </p>
      {/* Sized to its label at every width, as before, rather than stretching
          into a full-bleed band on a wide screen. */}
      <Link to={primary} className={`${btnPrimary} self-start`}>
        {t('index.get_started')}
      </Link>
      <nav className="flex flex-wrap gap-3.5 text-[13.5px]">
        <Link to="/accounts">{t('footer.accounts')}</Link>
        <Link to="/apps">{t('footer.apps')}</Link>
        <Link to="/signmessage">{t('footer.sign_message')}</Link>
        <Link to="/about">{t('footer.about')}</Link>
      </nav>
    </section>
  );
}
