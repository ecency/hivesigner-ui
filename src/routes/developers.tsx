import { createFileRoute } from '@tanstack/react-router';
import { Trans, useTranslation } from 'react-i18next';
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
        <Trans
          i18nKey="developers.docs_at"
          components={{
            docs: (
              // biome-ignore lint/a11y/useAnchorContent: Trans fills in the text
              <a
                href="https://docs.hivesigner.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-ink"
                translate="no"
              />
            ),
          }}
        />
      </p>

      {/* Two pointer cards: stacked on a phone, side by side once the shell widens. */}
      <div className={cardGrid}>
        <div className={`${card} flex flex-col gap-1.5`}>
          <div className="font-semibold">{t('developers.add_app_title')}</div>
          <p className={cardBody}>{t('developers.add_app_body')}</p>
        </div>

        <div className={`${card} flex flex-col gap-1.5`}>
          <div className="font-semibold">{t('developers.sdk_title')}</div>
          <p className={cardBody}>
            <Trans
              i18nKey="developers.sdk_body"
              components={{
                sdk: (
                  // biome-ignore lint/a11y/useAnchorContent: Trans fills in the text
                  <a
                    href="https://github.com/ecency/hivesigner.js"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-ink"
                    translate="no"
                  />
                ),
              }}
            />
          </p>
        </div>
      </div>
    </section>
  );
}
