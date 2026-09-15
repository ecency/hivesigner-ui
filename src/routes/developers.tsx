import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { card, cardGrid, h1, muted, page } from '@/components/ui';

// Developer docs pointers. Static links; the app registration itself is done on
// the profile page (account_update2 with the app's redirect_uris).
export const Route = createFileRoute('/developers')({
  component: Developers,
});

// Body copy inside a pointer card: a step smaller than `muted`, with room to
// breathe. No recipe covers it, and both cards share it.
const cardBody = 'm-0 text-[13px] leading-[1.5] text-muted';

function Developers() {
  const { t } = useTranslation();
  return (
    <section className={page}>
      <h1 className={h1}>{t('developers.developers')}</h1>

      <p className={`m-0 ${muted}`}>
        Full documentation is at{' '}
        <a
          href="https://docs.hivesigner.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-ink"
        >
          docs.hivesigner.com
        </a>
        .
      </p>

      {/* Two pointer cards: stacked on a phone, side by side once the shell widens. */}
      <div className={cardGrid}>
        <div className={`${card} flex flex-col gap-1.5`}>
          <div className="font-semibold">{t('developers.1.title')}</div>
          <p className={cardBody}>
            Create a Hive account for your app, then set its type to
            "application" and register your redirect URIs on the profile page.
          </p>
        </div>

        <div className={`${card} flex flex-col gap-1.5`}>
          <div className="font-semibold">{t('developers.3.title')}</div>
          <p className={cardBody}>
            Integrate with the official SDK:{' '}
            <a
              href="https://github.com/ecency/hivesigner.js"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-ink"
            >
              hivesigner.js
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
