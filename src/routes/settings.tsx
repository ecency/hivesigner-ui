import { createFileRoute } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelect } from '@/components/LanguageSelect';
import { ThemeIcon } from '@/components/ThemeToggle';
import {
  cardTight,
  formColumn,
  h1,
  label,
  labelText,
  mutedXs,
  page,
} from '@/components/ui';
import { themes } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

// Settings. Node selection and RPC timeouts are handled automatically by the
// SDK (multi-node failover), so there is no custom-node control - just the
// per-device UI language.
export const Route = createFileRoute('/settings')({
  component: Settings,
});

function Settings() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const languageId = useId();
  const { theme, setTheme } = useTheme();

  return (
    // A settings form, so it stays one readable column instead of stretching
    // across the wider shell.
    <section className={`${page} ${formColumn} sm:max-w-xl`}>
      <h1 className={h1}>{t('settings.settings')}</h1>

      {/* The control itself stays a comfortable field width on a desktop. */}
      <div className={`${label} max-w-sm`}>
        <label htmlFor={languageId} className={labelText}>
          {t('settings.language')}
        </label>
        <LanguageSelect id={languageId} tall onPicked={setSaved} />
      </div>

      {saved && (
        <output className="block text-[13px] text-ok">
          {t('settings.saved')}
        </output>
      )}

      {/* The header carries a single cycling button, which is all that fits
          next to the brand and the domain cue on a phone. Here there is room to
          show all three states at once, so the choice is explicit. A radio
          group, not buttons: these are three values of one setting, and arrow
          keys should move between them. */}
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className={`${labelText} mb-1 p-0`}>{t('theme.theme')}</legend>
        <div className="flex flex-wrap gap-2">
          {themes.map((option) => (
            <label
              key={option}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] ${
                theme === option
                  ? 'border-brand bg-brand-tint font-semibold text-ink'
                  : 'border-line bg-surface text-muted hover:bg-subtle'
              }`}
            >
              <input
                type="radio"
                name="theme"
                value={option}
                checked={theme === option}
                onChange={() => setTheme(option)}
                className="sr-only"
              />
              <ThemeIcon theme={option} />
              {t(`theme.${option}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={`${cardTight} ${mutedXs} leading-normal`}>
        {t('settings.node_note')}
      </div>
    </section>
  );
}
