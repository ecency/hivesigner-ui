import { useTranslation } from 'react-i18next';
import { Sentence } from '@/components/Untranslated';
import { mutedXs } from '@/components/ui';

/**
 * What posting authority lets an app do, as one list under one heading, with
 * the footnote that it is ONE grant.
 *
 * Shared by the landing-page illustration and the real consent screen, so the
 * promise a visitor reads on the home page is the sentence they approve later.
 * The bullets describe the AUTHORIZED APP's abilities, which is accurate; what
 * they must never imply is that each is separately granted. Hive has one
 * posting authority and Hivesigner has two scopes, nothing finer.
 *
 * The keys live under `index.preview_*` because the illustration had them
 * first; they are the consent copy now too.
 */
export function PostingAbilities({
  app,
  compact = false,
  brief = false,
}: {
  app: string;
  /** Tighter spacing for the consent card, which sits above two buttons. */
  compact?: boolean;
  /**
   * Titles only, no explanations and no footnote: for the landing-page
   * illustration, which is a picture of the request, not the request. The
   * real consent screen always shows the full list.
   */
  brief?: boolean;
}) {
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
    <div className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-3'}`}>
      {/* The app name is attacker-influenced text (the client id from the
          URL); isolate it so a right-to-left name cannot reorder the sentence. */}
      <div className="text-[13px] text-muted [unicode-bidi:isolate]">
        <Sentence k="index.preview_with_posting" values={{ app }} />
      </div>
      <ul
        className={`m-0 flex list-none flex-col p-0 ${compact ? 'gap-2' : 'gap-3'}`}
      >
        {abilities.map((a) => (
          <li
            key={a.title}
            className={`flex gap-3 ${brief ? 'items-center' : 'items-start'}`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-lg bg-subtle text-ink ${brief ? 'h-7 w-7' : 'h-8 w-8'}`}
            >
              {a.icon}
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold">{a.title}</div>
              {!brief && <div className={mutedXs}>{a.body}</div>}
            </div>
          </li>
        ))}
      </ul>
      {!brief && (
        <p className={`${mutedXs} leading-[1.5]`}>
          {t('index.preview_one_grant')}
        </p>
      )}
    </div>
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
