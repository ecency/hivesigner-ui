import * as Sentry from '@sentry/browser';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportIssue } from '@/components/ReportIssue';
import { btnPrimary, btnSecondary, h1, muted, page } from '@/components/ui';
import { isChunkLoadError, reloadOnce } from '@/lib/chunk-reload';
import { routeFamily } from '@/lib/sentry';

/**
 * A screen that threw while rendering. The router's boundary catches it, so
 * the global error handler never sees it: without this, an edge case nobody
 * covered would show a blank area and leave no trace anywhere. It is reported
 * here (the event goes through the same scrubbing as everything else) and
 * the user gets a way out.
 *
 * A route file that failed to load is first retried with one reload, which is
 * what fixes a page opened before a release. Only a failure that survives the
 * reload is shown and reported.
 */
export function ErrorPage({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const chunk = isChunkLoadError(error);
  const [recovering, setRecovering] = useState(chunk);
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  // Remembered across effect runs: Strict Mode runs this effect twice, and
  // the second run must not read the marker the first one just set as "a
  // reload already failed".
  const reloading = useRef(false);
  useEffect(() => {
    if (chunk && !reloading.current) reloading.current = reloadOnce();
    // The page is going away; nothing to show or report.
    if (reloading.current) return;
    setRecovering(false);
    try {
      setEventId(
        chunk
          ? // A message, not the exception: error monitoring drops chunk
            // load exceptions as noise, and one that a reload did not fix is
            // exactly what should be seen. The route family (a bounded
            // vocabulary) is part of the message because the SDK drops a
            // repeat of an identical one, and a second route failing in the
            // same tab is worth counting.
            Sentry.captureMessage(
              `chunk_load_failed: ${routeFamily(window.location.pathname)}`,
              {
                level: 'warning',
                tags: { boundary: 'route' },
                fingerprint: ['chunk_load_failed'],
              },
            )
          : Sentry.captureException(error, { tags: { boundary: 'route' } }),
      );
    } catch {
      // never let reporting fail the fallback
    }
  }, [error, chunk]);

  if (recovering) {
    return (
      <section className={page} aria-busy="true">
        …
      </section>
    );
  }
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
      <ReportIssue
        kind={chunk ? 'chunk_load_failed' : 'render_error'}
        associatedEventId={eventId}
      />
    </section>
  );
}
