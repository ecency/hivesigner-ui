import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Every test imports a fresh i18n module, so startup runs again with the
// storage and browser languages the test set up.
async function fresh() {
  const mod = await import('./index');
  await mod.languageReady;
  return mod;
}

function browserPrefers(...languages: string[]) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.doUnmock('./locales');
  const { default: i18n } = await import('./index');
  await i18n.changeLanguage('en');
});

describe('starting language', () => {
  it('is a language picked on this device, once its dictionary is here', async () => {
    localStorage.setItem('hs_lang', 'ru');
    browserPrefers('de-DE');
    const { default: i18n } = await fresh();
    expect(i18n.language).toBe('ru');
    expect(i18n.hasResourceBundle('ru', 'translation')).toBe(true);
    expect(document.documentElement.lang).toBe('ru');
  });

  it("is the browser's first shipped language when nothing was picked, and is not stored", async () => {
    browserPrefers('xx-YY', 'pt-BR', 'de');
    const { default: i18n } = await fresh();
    expect(i18n.language).toBe('pt');
    expect(localStorage.getItem('hs_lang')).toBeNull();
  });

  it('stays English for an English browser', async () => {
    browserPrefers('en-GB', 'es');
    const { default: i18n } = await fresh();
    expect(i18n.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('stays English when the dictionary cannot be loaded', async () => {
    browserPrefers('es');
    vi.doMock('./locales', async (importOriginal) => {
      const real = await importOriginal<typeof import('./locales')>();
      return {
        ...real,
        loaders: {
          ...real.loaders,
          es: () => Promise.reject(new Error('offline')),
        },
      };
    });
    const { default: i18n } = await fresh();
    expect(i18n.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('hs_lang')).toBeNull();
  });
});

describe('the document', () => {
  it('follows the language: lang, and right to left for Arabic and Persian', async () => {
    const { switchLanguage } = await fresh();
    await switchLanguage('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    await switchLanguage('zh-TW');
    expect(document.documentElement.lang).toBe('zh-Hant');
    expect(document.documentElement.dir).toBe('ltr');
    await switchLanguage('fa');
    expect(document.documentElement.dir).toBe('rtl');
    await switchLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});

describe('switchLanguage', () => {
  it('stores a pick, and only a pick', async () => {
    const { switchLanguage, default: i18n } = await fresh();
    await switchLanguage('de');
    expect(localStorage.getItem('hs_lang')).toBeNull();
    expect(await switchLanguage('ja', { remember: true })).toBe(true);
    expect(i18n.language).toBe('ja');
    expect(localStorage.getItem('hs_lang')).toBe('ja');
  });

  it('lets the newest request win over a slower one', async () => {
    let finishSlow: (value: { default: object }) => void = () => {};
    vi.doMock('./locales', async (importOriginal) => {
      const real = await importOriginal<typeof import('./locales')>();
      return {
        ...real,
        loaders: {
          ...real.loaders,
          ko: () =>
            new Promise<{ default: object }>((resolve) => {
              finishSlow = resolve;
            }),
        },
      };
    });
    const { switchLanguage, default: i18n } = await fresh();
    const slow = switchLanguage('ko', { remember: true });
    await switchLanguage('it', { remember: true });
    finishSlow({ default: {} });
    expect(await slow).toBe(false);
    expect(i18n.language).toBe('it');
    expect(localStorage.getItem('hs_lang')).toBe('it');
  });

  it("keeps the page and reloads once when a pick's file is gone after a release", async () => {
    const chunkError = Object.assign(new Error('Loading chunk 77 failed.'), {
      name: 'ChunkLoadError',
    });
    vi.doMock('./locales', async (importOriginal) => {
      const real = await importOriginal<typeof import('./locales')>();
      return {
        ...real,
        loaders: { ...real.loaders, vi: () => Promise.reject(chunkError) },
      };
    });
    const reloadOnce = vi.fn(() => true);
    vi.doMock('@/lib/chunk-reload', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@/lib/chunk-reload')>()),
      reloadOnce,
    }));
    const { switchLanguage, default: i18n } = await fresh();
    expect(await switchLanguage('vi', { remember: true })).toBe(false);
    expect(i18n.language).toBe('en');
    // Stored, so the reloaded page opens in it.
    expect(localStorage.getItem('hs_lang')).toBe('vi');
    expect(reloadOnce).toHaveBeenCalledTimes(1);
    vi.doUnmock('@/lib/chunk-reload');
  });
});
