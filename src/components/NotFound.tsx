import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportIssue } from '@/components/ReportIssue';
import { btnSecondary, h1, muted, page } from '@/components/ui';
import { reportIntegrationIssue } from '@/lib/integration-signal';

/** An unknown route. TanStack's default was the bare string "Not Found". */
export function NotFound() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The first segment only: enough to see which entry point a link expected.
  const path = pathname.split('/').filter(Boolean)[0] ?? '';
  useEffect(() => {
    reportIntegrationIssue('route_not_found', { path });
  }, [path]);
  return (
    <section className={`${page} items-start`}>
      <h1 className={h1}>{t('errors.not_found_title')}</h1>
      <p className={muted}>{t('errors.not_found_body')}</p>
      <Link to="/" className={btnSecondary}>
        {t('errors.not_found_home')}
      </Link>
      <ReportIssue kind="route_not_found" tags={{ path }} />
    </section>
  );
}
