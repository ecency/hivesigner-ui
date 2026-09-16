import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

/**
 * The Hivesigner logo, the same file the previous app shipped (public/logo.svg,
 * 110x131), used by the header, the footer and the About download link so
 * there is one mark everywhere. `size` is the rendered height.
 */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <img
      src="/logo.svg"
      alt=""
      width={Math.round((size * 110) / 131)}
      height={size}
      className="shrink-0"
      aria-hidden="true"
    />
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
