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

/**
 * Whether the first character of `text` is drawn left of the second, for
 * every place the page shows it.
 */
async function readsLeftToRight(page: Page, text: string) {
  const found = await page.evaluate((wanted) => {
    const results: boolean[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const at = node.textContent?.indexOf(wanted) ?? -1;
      if (at < 0) continue;
      const box = (i: number) => {
        const range = document.createRange();
        range.setStart(node, at + i);
        range.setEnd(node, at + i + 1);
        return range.getBoundingClientRect().x;
      };
      results.push(box(0) < box(1));
    }
    return results;
  }, text);
  if (found.length === 0) throw new Error(`no text ${text}`);
  return found.every(Boolean);
}

test('Arabic keeps names, amounts and hosts reading as they are', async ({
  page,
}) => {
  await setUp(page);
  await pick(page, 'ar');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${TRANSFER}&redirect_uri=${encodeURIComponent(CALLBACK)}`, {
    waitUntil: 'networkidle',
  });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  // "@bob", not "bob@"; "1.000 HIVE", not "HIVE 1.000".
  expect(await readsLeftToRight(page, '@bob')).toBe(true);
  expect(await readsLeftToRight(page, '1.000 HIVE')).toBe(true);
  expect(await readsLeftToRight(page, '@alice')).toBe(true);
  // An Arabic memo still reads right to left inside it.
  await page.goto(
    '/sign/transfer?from=alice&to=bob&amount=1.000%20HIVE&memo=%D8%B4%D9%83%D8%B1%D8%A7',
    { waitUntil: 'networkidle' },
  );
  expect(await readsLeftToRight(page, 'شكرا')).toBe(false);

  // The sentence around the values still lines up right to left.
  const memo = page.getByText('شكرا', { exact: true });
  const card = await page
    .locator('main .text-lg.font-bold')
    .first()
    .boundingBox();
  const value = await memo.boundingBox();
  expect((value?.x ?? 0) + (value?.width ?? 0)).toBeGreaterThan(
    (card?.x ?? 0) + 100,
  );

  // A name in a block of its own reads the same and still lines up with the
  // page's right edge.
  await page.route('**/api/apps', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        apps: [{ username: 'peakd.app', about: 'Hive frontend', users: 3 }],
        featured: [],
      }),
    }),
  );
  await page.goto('/apps', { waitUntil: 'networkidle' });
  expect(await readsLeftToRight(page, '@peakd.app')).toBe(true);
  const gap = await page
    .locator('main bdi', { hasText: '@peakd.app' })
    .evaluate(
      (el) =>
        (el.parentElement?.getBoundingClientRect().right ?? 0) -
        el.getBoundingClientRect().right,
    );
  expect(gap).toBeLessThan(2);

  // An account inside a translated sentence, on the grant page.
  await page.goto('/authorize/peakd.app', { waitUntil: 'networkidle' });
  await expect(page.locator('main')).toContainText('@peakd.app');
  expect(await readsLeftToRight(page, '@peakd.app')).toBe(true);
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
          page.getByText('спасибо — thanks', { exact: true }),
        ).toHaveAttribute('translate', 'no');
      }
    }
    expect(errors).toEqual([]);
  });
}
