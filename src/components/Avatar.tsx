import { useState } from 'react';

// Hive account avatars, from the Ecency image proxy. This host is the one the
// CSP's img-src allows; adding another would need nginx.conf changed too.
const AVATAR_HOST = 'https://i.ecency.com';

const SIZES = {
  sm: { px: 28, file: 'small', text: 'text-[11px]' },
  md: { px: 36, file: 'small', text: 'text-sm' },
  lg: { px: 56, file: 'medium', text: 'text-xl' },
  xl: { px: 80, file: 'medium', text: 'text-3xl' },
} as const;

export type AvatarSize = keyof typeof SIZES;

/**
 * The avatar URL for an account, or null when the name cannot appear in one.
 *
 * Account names arrive from the chain and from URLs, so they are not trusted
 * here. Hive names are lowercase letters, digits, dots and dashes; anything
 * else is refused outright rather than escaped, because a name that cannot be
 * a real account has nothing to show anyway.
 */
export function avatarUrl(
  username: string,
  size: AvatarSize = 'md',
): string | null {
  if (!/^[a-z][a-z0-9.-]{2,15}$/.test(username)) return null;
  return `${AVATAR_HOST}/u/${username}/avatar/${SIZES[size].file}`;
}

/**
 * An account's avatar, falling back to its initial.
 *
 * The fallback is not decoration: i.ecency.com 404s or times out for accounts
 * with no uploaded picture, and a broken-image icon next to a username on a
 * signing screen looks like something went wrong with the account.
 *
 * Decorative by design (`alt=""`): every caller puts the account name in text
 * next to it, so an alt would make a screen reader read the name twice.
 */
export function Avatar({
  username,
  size = 'md',
  className = '',
}: {
  username: string;
  size?: AvatarSize;
  className?: string;
}) {
  // Which image failed, not merely THAT one did. React reuses this component
  // when the route param or the selected account changes, so a plain boolean
  // stayed true and pinned the next account to its letter without ever trying
  // its picture. Deriving from props needs no effect and cannot go stale.
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const id = `${username}|${size}`;
  const { px, text } = SIZES[size];
  const url = failedFor === id ? null : avatarUrl(username, size);
  const box = `flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft ${className}`;

  if (!url) {
    return (
      <div
        className={`${box} ${text} font-bold uppercase text-brand-ink`}
        style={{ width: px, height: px }}
        aria-hidden="true"
        translate="no"
      >
        {username.slice(0, 1)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      onError={() => setFailedFor(id)}
      className={box}
      style={{ width: px, height: px }}
    />
  );
}
