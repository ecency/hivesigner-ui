import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Every test imports a fresh i18n module, so startup runs again with the
// storage and browser languages the test set up.
async function fresh(path = '/') {
  const mod = await import('./index');
  await mod.startLanguage(5_000, () => path);
  return mod;
}

/** A loader that fails, for `lang`. */
function failing(lang: string, error: Error = new Error('offline')) {
  vi.doMock('./locales', async (importOriginal) => {
    const real = await importOriginal<typeof import('./locales')>();
    return {
      ...real,
      loaders: { ...real.loaders, [lang]: () => Promise.reject(error) },
    };
  });
}

const sentry = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock('@sentry/browser', () => sentry);

function browserPrefers(...languages: string[]) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
}

beforeEach(() => {
  vi.resetModules();
  sentry.captureMessage.mockReset();
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

  it('stays English when the dictionary cannot be loaded, and says so', async () => {
    browserPrefers('es');
    failing('es');
    const { default: i18n } = await fresh();
    expect(i18n.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('hs_lang')).toBeNull();
    await Promise.resolve();
    expect(sentry.captureMessage).toHaveBeenCalledWith(
      'language_load_failed: es',
      expect.objectContaining({ level: 'warning' }),
    );
  });

  it("falls back to the browser's language when a picked one cannot be loaded", async () => {
    localStorage.setItem('hs_lang', 'fr');
    browserPrefers('de-DE');
    failing('fr');
    const { default: i18n } = await fresh();
    expect(i18n.language).toBe('de');
    // The pick stays; it may load next time.
    expect(localStorage.getItem('hs_lang')).toBe('fr');
  });

  it('lets the first screen render after the wait, and applies a late language', async () => {
    browserPrefers('it');
    let finish: (value: { default: object }) => void = () => {};
    vi.doMock('./locales', async (importOriginal) => {
      const real = await importOriginal<typeof import('./locales')>();
      return {
        ...real,
        loaders: {
          ...real.loaders,
          it: () =>
            new Promise<{ default: object }>((resolve) => {
              finish = resolve;
            }),
        },
      };
    });
    const { default: i18n, startLanguage } = await import('./index');
    await startLanguage(10, () => '/apps');
    expect(i18n.language).toBe('en');
    finish({ default: {} });
    await vi.waitFor(() => expect(i18n.language).toBe('it'));
  });

  it('holds a late language back on a screen being approved, until the next page', async () => {
    browserPrefers('ar');
    let finish: (value: { default: object }) => void = () => {};
    vi.doMock('./locales', async (importOriginal) => {
      const real = await importOriginal<typeof import('./locales')>();
      return {
        ...real,
        loaders: {
          ...real.loaders,
          ar: () =>
            new Promise<{ default: object }>((resolve) => {
              finish = resolve;
            }),
        },
      };
    });
    const mod = await import('./index');
    await mod.startLanguage(10, () => '/sign/transfer');
    finish({ default: {} });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mod.default.language).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    mod.applyDeferredLanguage('/sign/transfer');
    expect(mod.default.language).toBe('en');
    mod.applyDeferredLanguage('/accounts');
    await vi.waitFor(() => expect(mod.default.language).toBe('ar'));
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('never holds back a language that was ready before the first screen', async () => {
    browserPrefers('ar');
    const { default: i18n } = await fresh('/oauth2/authorize');
    expect(i18n.language).toBe('ar');
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

  it('keeps the page and stores nothing when a pick cannot be loaded', async () => {
    failing(
      'vi',
      Object.assign(new Error('Loading chunk 77 failed.'), {
        name: 'ChunkLoadError',
      }),
    );
    const { switchLanguage, default: i18n } = await fresh();
    await switchLanguage('de', { remember: true });
    expect(await switchLanguage('vi', { remember: true })).toBe(false);
    expect(i18n.language).toBe('de');
    expect(localStorage.getItem('hs_lang')).toBe('de');
    await Promise.resolve();
    expect(sentry.captureMessage).toHaveBeenCalledWith(
      'language_load_failed: vi',
      expect.objectContaining({ tags: { chunk: 'true' } }),
    );
  });

  it('cancels a held-back language when the user picks one', async () => {
    browserPrefers('ar');
    let finish: (value: { default: object }) => void = () => {};
    vi.doMock('./locales', async (importOriginal) => {
      const real = await importOriginal<typeof import('./locales')>();
      return {
        ...real,
        loaders: {
          ...real.loaders,
          ar: () =>
            new Promise<{ default: object }>((resolve) => {
              finish = resolve;
            }),
        },
      };
    });
    const mod = await import('./index');
    await mod.startLanguage(10, () => '/sign/transfer');
    // Arabic arrives while the request is on screen, and is held back.
    finish({ default: {} });
    await new Promise((resolve) => setTimeout(resolve, 20));
    await mod.switchLanguage('ja', { remember: true });
    mod.applyDeferredLanguage('/accounts');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mod.default.language).toBe('ja');
  });
});
