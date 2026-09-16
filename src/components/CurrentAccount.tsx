import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { cardTight, link } from '@/components/ui';

/**
 * The account a consent or signing screen is about to act as, made hard to
 * miss: avatar, name and a way to change it, in one row above the action.
 *
 * A one-line "Authorizing as @name" in caption grey was easy to skim past,
 * and a user with several accounts on the device could approve a request
 * for the wrong one without noticing. The switch link carries `next`, so
 * picking another account on /accounts returns to this same request instead
 * of making the app start the whole flow over.
 */
export function CurrentAccount({
  username,
  label,
  next,
}: {
  username: string;
  /** "Authorizing as" / "Signing as": the verb this screen is about. */
  label: string;
  /** The current request, path plus query, to come back to after switching. */
  next: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`${cardTight} flex items-center gap-3`}
      data-testid="current-account"
    >
      <Avatar username={username} size="md" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted">{label}</div>
        <div className="truncate text-[15px] font-semibold text-ink">
          @{username}
        </div>
      </div>
      <Link
        to="/accounts"
        search={{ next }}
        className={`${link} shrink-0 text-[13px]`}
      >
        {t('login.switch_an_account')}
      </Link>
    </div>
  );
}
