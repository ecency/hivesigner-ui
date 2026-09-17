import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { switchLanguage } from '@/i18n';
import { isLanguage, LANGUAGES, type Language } from '@/i18n/languages';

function GlobeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The language menu, in the footer and on the settings page. Each language is
 * listed by its own name, which someone who cannot read the current one still
 * recognises, next to a globe, which needs no reading at all. A pick is
 * remembered on this device and wins over the browser's language from then on.
 */
export function LanguageSelect({
  className = '',
  tall = false,
  onPicked,
}: {
  className?: string;
  /** Form-field height, for the settings page. */
  tall?: boolean;
  /** Called once a pick has been applied, with whether it could be. */
  onPicked?: (applied: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  // The pick shows at once, even while its dictionary is still on the way.
  const [pending, setPending] = useState<Language | null>(null);
  const current: Language = isLanguage(i18n.language) ? i18n.language : 'en';

  async function pick(value: string) {
    if (!isLanguage(value)) return;
    setPending(value);
    const applied = await switchLanguage(value, { remember: true });
    setPending(null);
    onPicked?.(applied);
  }

  return (
    <div className={`relative ${className}`}>
      <GlobeIcon />
      {/* The names are each language's own: never machine-translated. */}
      <select
        translate="no"
        aria-label={t('settings.language')}
        value={pending ?? current}
        onChange={(e) => pick(e.target.value)}
        className={`${tall ? 'h-11 text-[15px]' : 'h-9 text-[13px]'} w-full cursor-pointer rounded-lg border border-line bg-surface ps-8 pe-3 text-ink`}
      >
        {LANGUAGES.map((l) => (
          <option
            key={l.code}
            value={l.code}
            lang={'htmlLang' in l ? l.htmlLang : l.code}
            dir={'rtl' in l ? 'rtl' : 'ltr'}
          >
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}
