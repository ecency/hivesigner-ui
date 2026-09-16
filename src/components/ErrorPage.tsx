import * as Sentry from '@sentry/browser';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportIssue } from '@/components/ReportIssue';
import { btnPrimary, btnSecondary, h1, muted, page } from '@/components/ui';

/**
 * A screen that threw while rendering. The router's boundary catches it, so
 * the global error handler never sees it: without this, an edge case nobody
 * covered would show a blank area and leave no trace anywhere. It is reported
 * here (the event goes through the same scrubbing as everything else) and
 * the user gets a way out.
 */
export function ErrorPage({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  useEffect(() => {
    try {
      setEventId(
        Sentry.captureException(error, { tags: { boundary: 'route' } }),
      );
    } catch {
      // never let reporting fail the fallback
    }
  }, [error]);
  return (
    <section className={`${page} items-start`}>
      <h1 className={h1}>{t('errors.something_wrong')}</h1>
      <p className={muted}>{t('errors.render_failed')}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={btnPrimary}
        >
          {t('errors.reload')}
        </button>
        <Link to="/" className={btnSecondary}>
          {t('errors.not_found_home')}
        </Link>
      </div>
      <ReportIssue kind="render_error" associatedEventId={eventId} />
    </section>
  );
}
