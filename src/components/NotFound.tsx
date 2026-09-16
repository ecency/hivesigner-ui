import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { btnSecondary, h1, muted, page } from '@/components/ui';

/** An unknown route. TanStack's default was the bare string "Not Found". */
export function NotFound() {
  const { t } = useTranslation();
  return (
    <section className={`${page} items-start`}>
      <h1 className={h1}>{t('errors.not_found_title')}</h1>
      <p className={muted}>{t('errors.not_found_body')}</p>
      <Link to="/" className={btnSecondary}>
        {t('errors.not_found_home')}
      </Link>
    </section>
  );
}
