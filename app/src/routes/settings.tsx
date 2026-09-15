import { createFileRoute } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLngs } from '@/i18n/locales';
import { getLanguage, type Language, setLanguage } from '@/lib/prefs';

// Settings. Node selection and RPC timeouts are handled automatically by the
// SDK (multi-node failover), so there is no custom-node control - just the
// per-device UI language.
export const Route = createFileRoute('/settings')({
  component: Settings,
});

const fld: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 48,
  padding: '0 12px',
  border: '1px solid #d1d9e0',
  borderRadius: 8,
  fontSize: 15,
};

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
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('settings.settings')}
      </h1>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {t('footer.network', { network: 'Language' })}
        </span>
        <select
          style={fld}
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
        <output style={{ display: 'block', fontSize: 13, color: '#1a5c2b' }}>
          {t('settings.saved')}
        </output>
      )}

      <div
        style={{
          background: '#fff',
          border: '1px solid #d1d9e0',
          borderRadius: 12,
          padding: 14,
          fontSize: 12.5,
          color: '#59636e',
          lineHeight: 1.5,
        }}
      >
        Hivesigner connects to Hive through a managed pool of nodes and fails
        over automatically, so there is no node to configure here.
      </div>
    </section>
  );
}
