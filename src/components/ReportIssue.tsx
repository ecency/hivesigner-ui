import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { btnGhost, fieldBase, mutedXs } from '@/components/ui';
import { sendUserReport, type UserReport } from '@/lib/sentry';

/**
 * "Report this problem", for any screen that had to refuse something. The
 * report carries the link that was opened (secrets blanked) and an optional
 * note, so an integration issue or an edge case nobody covered arrives with
 * enough to reproduce it. Automatic signals count the failures; this is how
 * the specific link gets to whoever can fix it.
 */
export function ReportIssue({
  kind,
  reason,
  tags,
  associatedEventId,
}: Omit<UserReport, 'note'>) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [sent, setSent] = useState<string | null | 'off'>(null);

  if (sent === 'off') return null;
  if (sent) {
    return (
      <output className={`${mutedXs} block`}>
        {t('report.thanks', { id: sent.slice(0, 8) })}
      </output>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className={mutedXs}>{t('report.note_label')}</span>
        <textarea
          rows={2}
          maxLength={2000}
          className={`${fieldBase} py-2 text-[13px]`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            const id = sendUserReport({
              kind,
              reason,
              note,
              tags,
              associatedEventId,
            });
            setSent(id ?? 'off');
          }}
        >
          {t('report.button')}
        </button>
        <span className={mutedXs}>{t('report.includes_link')}</span>
      </div>
    </div>
  );
}
