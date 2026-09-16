import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

/** The shield mark. One drawing, used by the header, the footer and the
 * consent illustration, so the three cannot drift apart. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M12 2 4 5v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V5l-8-3Z"
        fill="#E31337"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Mark plus wordmark, linking home. */
export function Brand() {
  const { t } = useTranslation();
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-2 text-ink no-underline"
      aria-label={t('index.title')}
    >
      <BrandMark />
      <span className="truncate text-base font-bold">Hivesigner</span>
    </Link>
  );
}
