import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { btnPrimary, btnSecondary, card, link, mutedXs } from '@/components/ui';

/** The app shown in the illustration. A real, registered app, so the card
 * shows the real thing; the ACCOUNT is a placeholder, because a marketing page
 * has no business showing anyone's real account. */
const DEMO_APP = 'ecency.app';
const DEMO_HOST = 'ecency.com';

/**
 * What a permission request looks like, as a STATIC illustration.
 *
 * The whole card is aria-hidden and contains no button, link or control: it
 * is a picture of the consent screen, not a second copy of it. The visible
 * "Authorize" and "Cancel" are spans. The caption underneath is real text with
 * a real link, so the accessible content is the sentence, not the picture.
 *
 * TRUTH IN THE LIST. The bullets describe what the AUTHORIZED APP can do once
 * it holds posting authority - post, comment, vote, follow - and that is
 * accurate. What they must not imply is that each line is a separately
 * granted permission: Hive has one posting authority, and Hivesigner's scopes
 * are `login` or `posting`, nothing finer. So the heading says the bullets are
 * consequences of ONE grant, and the footnote says so again.
 *
 * The footnote must not say the active key is "never involved": a first-time
 * grant IS an account_update signed here with the active key. What is true,
 * and what matters to the person reading it, is that no key ever reaches the
 * app and the grant cannot move funds.
 */
export function ConsentPreview() {
  const { t } = useTranslation();

  const abilities = [
    {
      title: t('index.preview_can_post'),
      body: t('index.preview_can_post_body'),
      icon: (
        <svg {...iconProps} aria-hidden="true">
          <path d="M4 20h4l10-10-4-4L4 16v4Z" />
          <path d="m13 7 4 4" />
        </svg>
      ),
    },
    {
      title: t('index.preview_can_vote'),
      body: t('index.preview_can_vote_body'),
      icon: (
        <svg {...iconProps} aria-hidden="true">
          <path d="M7 10v10H4V10h3Zm4 10h6.5a2 2 0 0 0 2-1.6l1.2-6A2 2 0 0 0 18.7 10H14V6a2 2 0 0 0-2-2l-1 6v10Z" />
        </svg>
      ),
    },
    {
      title: t('index.preview_can_follow'),
      body: t('index.preview_can_follow_body'),
      icon: (
        <svg {...iconProps} aria-hidden="true">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20a6 6 0 0 1 12 0M17 8v6m3-3h-6" />
        </svg>
      ),
    },
  ];

  return (
    <figure className="m-0 flex flex-col gap-3">
      {/* TILTED, so it reads as a picture of a form rather than a form. A flat
          card with a red "Authorize" button looked actionable, however inert
          it was. The perspective and the rotation are slight on a phone, where
          the card fills the column and a strong turn would clip its edge, and
          stronger from lg where there is room beside the copy. `preserve-3d`
          is not needed: nothing inside is transformed. */}
      <div className="[perspective:1400px] px-2 py-3 sm:px-4 lg:px-0 lg:py-6">
        <div
          aria-hidden="true"
          className={`${card} pointer-events-none relative flex flex-col gap-4 p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)] select-none [transform:rotateY(-5deg)_rotateX(2deg)] sm:p-6 lg:[transform:rotateY(-9deg)_rotateX(4deg)_translateX(6px)]`}
        >
          {/* A badge that says what this is, in the picture itself. */}
          <span className="absolute -top-3 right-5 rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
            {t('index.preview_badge')}
          </span>
          <div className="flex items-center gap-3">
            <Avatar username={DEMO_APP} size="md" />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold">{DEMO_APP}</div>
              <div className={mutedXs}>{t('index.preview_wants_access')}</div>
            </div>
          </div>

          {/* The account picker, with a placeholder: no real account here. */}
          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-subtle px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-bold text-brand-ink">
              @
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
              @{t('index.preview_account')}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-muted"
              aria-hidden="true"
            >
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-[13px] text-muted">
              {t('index.preview_with_posting', { app: DEMO_APP })}
            </div>
            {abilities.map((a) => (
              <div key={a.title} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink">
                  {a.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold">{a.title}</div>
                  <div className={mutedXs}>{a.body}</div>
                </div>
              </div>
            ))}
            <p className={`${mutedXs} leading-[1.5]`}>
              {t('index.preview_one_grant')}
            </p>
          </div>

          <div className={mutedXs}>
            {t('authorize.sends_you_to')}{' '}
            <b className="text-ink">{DEMO_HOST}</b>
          </div>

          {/* Spans, not buttons: this is a picture. */}
          <div className="flex gap-3">
            <span className={`${btnPrimary} h-11 flex-1 text-[15px]`}>
              {t('authorize.authorize')}
            </span>
            <span className={`${btnSecondary} h-11 flex-1 text-[15px]`}>
              {t('common.cancel')}
            </span>
          </div>
        </div>
      </div>

      <figcaption className={`${mutedXs} text-center leading-[1.5]`}>
        {t('index.preview_caption')}{' '}
        <Link to="/authorized-apps" className={link}>
          {t('index.preview_revoke')}
        </Link>
      </figcaption>
    </figure>
  );
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
