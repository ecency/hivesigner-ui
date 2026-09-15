import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cardTight, field, h1, label, mutedXs, page } from '@/components/ui';
import { supportedLngs } from '@/i18n/locales';
import { getLanguage, type Language, setLanguage } from '@/lib/prefs';

// Settings. Node selection and RPC timeouts are handled automatically by the
// SDK (multi-node failover), so there is no custom-node control - just the
// per-device UI language.
export const Route = createFileRoute('/settings')({
  component: Settings,
});

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', ru: 'Русский' };

function Settings() {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<Language>(getLanguage());
  const [saved, setSaved] = useState(false);

  function change(next: Language) {
    setLang(next);
    setLanguage(next);
    i18n.changeLanguage(next);
    setSaved(true);
  }

  return (
    // A settings form, so it stays one readable column instead of stretching
    // across the wider shell.
    <section className={`${page} sm:max-w-xl`}>
      <h1 className={h1}>{t('settings.settings')}</h1>

      {/* The control itself stays a comfortable field width on a desktop. */}
      <label className={`${label} max-w-sm`}>
        <span className="font-semibold">
          {t('footer.network', { network: 'Language' })}
        </span>
        <select
          className={field}
          aria-label="Language"
          value={lang}
          onChange={(e) => change(e.target.value as Language)}
        >
          {supportedLngs.map((l) => (
            <option key={l} value={l}>
              {LANGUAGE_NAMES[l] ?? l}
            </option>
          ))}
        </select>
      </label>

      {saved && (
        <output className="block text-[13px] text-[#1a5c2b]">
          {t('settings.saved')}
        </output>
      )}

      <div className={`${cardTight} ${mutedXs} leading-normal`}>
        Hivesigner connects to Hive through a managed pool of nodes and fails
        over automatically, so there is no node to configure here.
      </div>
    </section>
  );
}
