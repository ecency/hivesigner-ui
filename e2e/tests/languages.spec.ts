import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { LANGUAGES } from '../../src/i18n/languages';
import {
  appAccount,
  dynamicGlobalProps,
  getConfig,
  mockHiveRpc,
} from '../fixtures/rpc';

// The app in the reader's language: picked from the browser on a first
// visit, from the footer menu after that, laid out right to left for Arabic
// and Persian, and never at the cost of the request values the user approves.

type Tree = { [key: string]: string | Tree };

const dictionaries = new Map<string, Tree>(
  LANGUAGES.map((l) => [
    l.code,
    JSON.parse(
      readFileSync(
        join(__dirname, '../../src/i18n/locales', `${l.file}.json`),
        'utf8',
      ),
    ) as Tree,
  ]),
);

/** A string of a language's dictionary. */
function text(code: string, key: string): string {
  let node: string | Tree | undefined = dictionaries.get(code);
  for (const part of key.split('.')) {
    node = typeof node === 'object' ? node[part] : undefined;
  }
  if (typeof node !== 'string') throw new Error(`${code}: no ${key}`);
  return node;
}

const CALLBACK = 'https://callback.example/done';
const TRANSFER =
  '/sign/transfer?from=alice&to=bob&amount=1.000%20HIVE&memo=%D1%81%D0%BF%D0%B0%D1%81%D0%B8%D0%B1%D0%BE%20%E2%80%94%20thanks';

/** Mocks, plus the page errors seen from here on. */
async function setUp(page: Page): Promise<string[]> {
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
    'condenser_api.get_accounts': ([names]: string[][]) =>
      names.map((n) => appAccount(n, [CALLBACK])),
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Open the app with `code` picked on this device. */
async function pick(page: Page, code: string) {
  await page.addInitScript((lang) => {
    localStorage.setItem('hs_lang', lang);
  }, code);
}

test.describe('in a Spanish browser', () => {
  test.use({ locale: 'es-ES' });

  test('the first visit opens in Spanish, without storing it', async ({
    page,
  }) => {
    await setUp(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('h1')).toContainText(
      text('es', 'index.hero_title'),
    );
    await expect(page).toHaveTitle(text('es', 'meta.home'));
    expect(
      await page.evaluate(() => localStorage.getItem('hs_lang')),
    ).toBeNull();
  });

  test('a language picked in the footer wins, and stays after a reload', async ({
    page,
  }) => {
    await setUp(page);
    await page.goto('/apps', { waitUntil: 'networkidle' });
    const menu = page.locator('footer select');
    await expect(menu).toHaveAccessibleName(text('es', 'settings.language'));
    await expect(menu).toHaveValue('es');
    await menu.selectOption('fr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('footer')).toContainText(
      text('fr', 'footer.accounts'),
    );
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(menu).toHaveValue('fr');
    await expect(page).toHaveTitle(`${text('fr', 'meta.apps')} · Hivesigner`);
  });
});

test('an English browser stays in English, and the menu offers every language by its own name', async ({
  page,
}) => {
  await setUp(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  const options = await page
    .locator('footer select option')
    .evaluateAll((els) =>
      els.map((el) => [
        (el as HTMLOptionElement).value,
        el.textContent,
        el.getAttribute('lang'),
      ]),
    );
  expect(options).toEqual(
    LANGUAGES.map((l) => [
      l.code,
      l.name,
      'htmlLang' in l ? l.htmlLang : l.code,
    ]),
  );
});

test('Arabic lays the page out right to left', async ({ page }) => {
  await setUp(page);
  await pick(page, 'ar');
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  // The brand, first in the header, sits on the right.
  const brand = await page.locator('header a').first().boundingBox();
  expect(brand).not.toBeNull();
  expect((brand?.x ?? 0) + (brand?.width ?? 0)).toBeGreaterThan(1024 / 2);
});

for (const language of LANGUAGES) {
  test(`${language.code}: the main screens fit a phone and keep request values exact`, async ({
    page,
  }) => {
    const errors = await setUp(page);
    await pick(page, language.code);
    await page.setViewportSize({ width: 320, height: 640 });
    const code = language.code;
    const htmlLang = 'htmlLang' in language ? language.htmlLang : code;

    for (const path of [
      '/',
      '/accounts',
      '/signs',
      TRANSFER,
      `/oauth2/authorize?client_id=granted.app&redirect_uri=${encodeURIComponent(CALLBACK)}&scope=posting`,
    ]) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('html')).toHaveAttribute('lang', htmlLang);
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        'rtl' in language ? 'rtl' : 'ltr',
      );
      await expect(page.locator('footer')).toContainText(
        text(code, 'footer.developers'),
      );
      // Nothing pushes the page sideways at 320px, in any language.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(
        overflow,
        `${path} overflows by ${overflow}px`,
      ).toBeLessThanOrEqual(0);

      if (path === TRANSFER) {
        // The summary is the translated sentence with the request's values
        // put in exactly, each outside translation.
        const title = page.locator('main .text-lg.font-bold').first();
        await expect(title).toHaveText(
          text(code, 'summary.transfer')
            .replace('{amount}', '1.000 HIVE')
            .replace('{to}', '@bob'),
        );
        // In the order this language puts them.
        const template = text(code, 'summary.transfer');
        const values = [
          ['{amount}', '1.000 HIVE'],
          ['{to}', '@bob'],
        ]
          .sort((a, b) => template.indexOf(a[0]) - template.indexOf(b[0]))
          .map(([, value]) => value);
        await expect(title.locator('[translate="no"]')).toHaveText(values);
        await expect(
          page.locator('main [translate="no"]', { hasText: 'спасибо' }),
        ).toHaveText('спасибо — thanks');
      }
    }
    expect(errors).toEqual([]);
  });
}
