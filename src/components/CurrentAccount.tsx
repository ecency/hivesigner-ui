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
  busy = false,
}: {
  username: string;
  /** "Authorizing as" / "Signing as": the verb this screen is about. */
  label: string;
  /** The current request, path plus query, to come back to after switching. */
  next: string;
  /**
   * The screen is signing or broadcasting: the row keeps naming the account
   * but the switch link goes away, because the operation in flight will
   * still redirect to the app's callback when it completes, and a user who
   * had moved to the account list would be pulled away from it.
   */
  busy?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`${cardTight} flex flex-wrap items-center gap-x-3 gap-y-1`}
      data-testid="current-account"
    >
      <Avatar username={username} size="md" />
      {/* Room for the label and the name first: a long "switch" label in
          some languages moves to its own line instead of squeezing them. */}
      <div className="min-w-0 flex-[1_1_9rem]">
        <div className="text-[11px] text-muted">{label}</div>
        {/* break-all, never truncate: the row exists so the user can check
            the EXACT account, and a 16-character name at 320px would lose
            the suffix that tells two similar accounts apart. translate="no":
            a page translator must not rewrite the name being checked. */}
        <div
          className="break-all text-[15px] font-semibold text-ink"
          translate="no"
        >
          <bdi>{`@${username}`}</bdi>
        </div>
      </div>
      {!busy && (
        <Link
          to="/accounts"
          search={{ next }}
          className={`${link} ms-auto shrink-0 text-[13px]`}
        >
          {t('login.switch_an_account')}
        </Link>
      )}
    </div>
  );
}
