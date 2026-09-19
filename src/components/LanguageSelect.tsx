import { useEffect, useRef, useState } from 'react';
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

// Keys that move through a closed <select> on Windows and Linux, changing its
// value on every press. Moving through the list must not switch the whole
// page each time (WCAG 3.2.2), so a keyboard choice applies on Enter, when the
// menu loses focus, or once the keys have rested this long.
const BROWSE_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);
export const KEYBOARD_SETTLE_MS = 1200;

/**
 * The language menu, in the footer and on the settings page. Each language is
 * listed by its own name, which someone who cannot read the current one still
 * recognises, next to a globe, which needs no reading at all. A pick is
 * remembered on this device and wins over the browser's language from then on.
 */
export function LanguageSelect({
  id,
  className = '',
  tall = false,
  onPicked,
}: {
  /** For a visible <label htmlFor>. */
  id?: string;
  className?: string;
  /** Form-field height, for the settings page. */
  tall?: boolean;
  /** Called once a pick has been applied, with whether it could be. */
  onPicked?: (applied: boolean, lang: Language) => void;
}) {
  const { t, i18n } = useTranslation();
  // The pick shows at once, even while its dictionary is still on the way.
  const [pending, setPending] = useState<Language | null>(null);
  const [failed, setFailed] = useState(false);
  // Only the newest pick answers: an older one that settles later must not
  // report on the newer one's behalf.
  const newest = useRef('');
  const current: Language = isLanguage(i18n.language) ? i18n.language : 'en';
  // A choice being made with the keyboard: shown, not applied yet.
  const [browsed, setBrowsed] = useState<Language | null>(null);
  const keyboard = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(settle.current), []);

  async function pick(value: string) {
    if (!isLanguage(value)) return;
    newest.current = value;
    setPending(value);
    setFailed(false);
    const applied = await switchLanguage(value, { remember: true });
    if (newest.current !== value) return;
    setPending(null);
    // The menu shows the language the page is in again; say why.
    setFailed(!applied);
    onPicked?.(applied, value);
  }

  function commit() {
    clearTimeout(settle.current);
    keyboard.current = false;
    if (browsed === null) return;
    setBrowsed(null);
    if (browsed !== (pending ?? current)) pick(browsed);
  }

  function change(value: string) {
    if (!isLanguage(value)) return;
    if (!keyboard.current) {
      pick(value);
      return;
    }
    setBrowsed(value);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      keyboard.current = false;
      setBrowsed(null);
      pick(value);
    }, KEYBOARD_SETTLE_MS);
  }

  return (
    <div className={className}>
      <div className="relative">
        <GlobeIcon />
        {/* The names are each language's own: never machine-translated. */}
        <select
          id={id}
          translate="no"
          aria-label={t('settings.language')}
          value={browsed ?? pending ?? current}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            else if (BROWSE_KEYS.has(e.key) || e.key.length === 1)
              keyboard.current = true;
          }}
          onPointerDown={() => {
            keyboard.current = false;
          }}
          onBlur={commit}
          onChange={(e) => change(e.target.value)}
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
      {failed && (
        <output className="mt-1 block text-[12px] text-warn">
          {t('common.try_again')}
        </output>
      )}
    </div>
  );
}
