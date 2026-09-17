import { expect, type Page, test } from '@playwright/test';
import {
  appAccount,
  dynamicGlobalProps,
  getConfig,
  mockHiveRpc,
} from '../fixtures/rpc';
import {
  emulateChromeTranslate,
  watchTranslatedPage,
} from '../fixtures/translate';

// A translated page (Chrome's built-in translate) must keep working. The
// translator swaps the app's text for its own elements, and React updating
// that text is what used to take the account list and the signing screen
// down with NotFoundError. Each flow here runs translated and must end where
// it would untranslated, with no error, no text left stale and nothing React
// added or removed landing next to text the translator took away.

// A throwaway key pair, not an account on chain (the unit tests use it too).
const WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';
const CALLBACK = 'https://callback.example/done';

function userAccount(name: string, granted: Set<string>) {
  const auth = (accounts: [string, number][] = []) => ({
    weight_threshold: 1,
    account_auths: accounts,
    key_auths: [[PUB, 1]],
  });
  return {
    name,
    // A real key: the grant serializes the account's memo key back.
    memo_key: PUB,
    owner: { weight_threshold: 1, account_auths: [], key_auths: [] },
    active: auth(),
    posting: auth([...granted].sort().map((app) => [app, 1])),
    json_metadata: '',
    posting_json_metadata: '',
  };
}

/** Mocks, plus the list of problems the page runs into from here on. */
async function setUp(page: Page): Promise<string[]> {
  // Every test account has already let `granted.app` post for it. A
  // broadcast (the only one here is the grant) adds `new.app`.
  const granted = new Set(['granted.app']);
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
    'condenser_api.get_accounts': ([names]: string[][]) =>
      names.map((n) =>
        n.endsWith('.app')
          ? appAccount(n, [CALLBACK])
          : userAccount(n, granted),
      ),
    'condenser_api.broadcast_transaction': () => {
      granted.add('new.app');
      return null;
    },
  });
  // The app's callback. It answers a moment late, as a real one would, so the
  // screen React renders on the way out is rendered before the browser moves.
  await page.route('https://callback.example/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'back',
    });
  });
  return watchTranslatedPage(page);
}

async function addAccount(page: Page, name: string, passcode?: string) {
  await page.goto('/import', { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', name);
  await page.fill('input[name="password"]', WIF);
  if (passcode) {
    await page.fill('input[name="passcode"]', passcode);
  } else {
    await page.getByRole('checkbox').uncheck();
  }
  await page.press('input[name="password"]', 'Enter');
  await page.waitForURL('**/accounts', { timeout: 20_000 });
}

/** Load `path` translated, once the translator has been through it. */
async function openTranslated(page: Page, path: string) {
  await emulateChromeTranslate(page);
  await page.goto(path, { waitUntil: 'networkidle' });
  await expect(page.locator('html.translated-ltr')).toHaveCount(1);
  await expect(
    page.locator('main font[data-translated]').first(),
  ).toBeAttached();
}

const row = (page: Page, name: string) =>
  page.locator('main [data-testid="account-row"]', { hasText: name });

test('accounts: switching, unlocking and removing keep the list current', async ({
  page,
}) => {
  const problems = await setUp(page);
  await addAccount(page, 'trone');
  await addAccount(page, 'trtwo', 'e2e-passcode');
  await addAccount(page, 'trthree');
  await openTranslated(page, '/accounts');

  // Switch to another account: "Current" moves with it.
  await row(page, 'trone')
    .getByRole('button', { name: /switch an account/i })
    .click();
  await expect(row(page, 'trone')).toContainText(/current/i);
  await expect(row(page, 'trthree')).not.toContainText(/current/i);

  // A wrong passcode, then the right one: the status line follows.
  await row(page, 'trtwo')
    .getByRole('button', { name: /unlock/i })
    .click();
  const field = page.locator('input[name="passcode-trtwo"]');
  await field.fill('wrong');
  await field.press('Enter');
  await expect(row(page, 'trtwo').getByRole('alert')).toBeVisible();
  await field.fill('e2e-passcode');
  await field.press('Enter');
  await expect(field).toHaveCount(0);
  await expect(row(page, 'trtwo')).toContainText(/unlocked/i);
  await expect(row(page, 'trtwo')).toContainText(/current/i);

  // Remove one: the rest stay.
  page.once('dialog', (d) => d.accept());
  await row(page, 'trone')
    .getByRole('button', { name: /remove/i })
    .click();
  await expect(row(page, 'trone')).toHaveCount(0);
  await expect(row(page, 'trthree')).toBeVisible();

  await expect(page.locator('body')).not.toContainText(/went wrong/i);
  expect(problems).toEqual([]);
});

test('sign: approving a transfer reaches the callback', async ({ page }) => {
  const problems = await setUp(page);
  await addAccount(page, 'trone');
  await openTranslated(
    page,
    `/sign/transfer?from=trone&to=ecency&amount=1.000%20HIVE&memo=hi&redirect_uri=${encodeURIComponent(CALLBACK)}`,
  );
  await page.getByRole('button', { name: /approve/i }).click();
  await page.waitForURL(`${CALLBACK}?id=*`);
  expect(page.url()).toMatch(/\?id=[0-9a-f]{40}$/);
  expect(problems).toEqual([]);
});

test('sign: without a callback the success screen is shown', async ({
  page,
}) => {
  const problems = await setUp(page);
  await addAccount(page, 'trone');
  await openTranslated(
    page,
    '/sign/delegate_vesting_shares?delegator=trone&delegatee=ecency&vesting_shares=10.000%20HP',
  );
  await page.getByRole('button', { name: /approve/i }).click();
  await expect(page.locator('main')).toContainText(/successfully/i);
  expect(problems).toEqual([]);
});

test('sign: a locked account is unlocked and the request comes back', async ({
  page,
}) => {
  const problems = await setUp(page);
  await addAccount(page, 'trtwo', 'e2e-passcode');
  await openTranslated(
    page,
    '/sign/vote?voter=trtwo&author=ecency&permlink=x&weight=10000',
  );
  await page.getByRole('link', { name: /unlock/i }).click();
  await page.waitForURL('**/accounts?**');
  await row(page, 'trtwo')
    .getByRole('button', { name: /unlock/i })
    .click();
  const field = page.locator('input[name="passcode-trtwo"]');
  await field.fill('e2e-passcode');
  await field.press('Enter');
  await page.waitForURL('**/sign/vote?**');
  await expect(page.getByRole('button', { name: /approve/i })).toBeVisible();
  expect(problems).toEqual([]);
});

test('consent: an app the account already granted gets its token', async ({
  page,
}) => {
  const problems = await setUp(page);
  await addAccount(page, 'trone');
  await openTranslated(
    page,
    `/oauth2/authorize?client_id=granted.app&redirect_uri=${encodeURIComponent(CALLBACK)}&scope=posting`,
  );
  await page.getByRole('button', { name: /authorize/i }).click();
  await page.waitForURL(`${CALLBACK}?**`);
  expect(page.url()).toContain('access_token=');
  expect(problems).toEqual([]);
});

test('import: a wrong key is reported, then the right one is added', async ({
  page,
}) => {
  const problems = await setUp(page);
  await openTranslated(page, '/import');
  await page.fill('input[name="username"]', 'trone');
  await page.fill('input[name="password"]', `${WIF.slice(0, -1)}x`);
  await page.getByRole('checkbox').uncheck();
  await page.press('input[name="password"]', 'Enter');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.fill('input[name="password"]', WIF);
  await page.press('input[name="password"]', 'Enter');
  await page.waitForURL('**/accounts');
  expect(problems).toEqual([]);
});

test('grant: authorizing an app shows it granted', async ({ page }) => {
  const problems = await setUp(page);
  await addAccount(page, 'trone');
  await openTranslated(page, '/authorize/new.app');
  await page.getByRole('button', { name: /authorize/i }).click();
  await expect(page.locator('main output')).toBeVisible();
  await expect(page.getByRole('link', { name: /continue/i })).toBeVisible();
  expect(problems).toEqual([]);
});

test('verify: checking a second message replaces the first result', async ({
  page,
}) => {
  const problems = await setUp(page);
  const tokens: string[] = [];
  for (const name of ['trone', 'trtwo']) {
    await addAccount(page, name);
    await page.goto('/signmessage', { waitUntil: 'networkidle' });
    await page.fill('textarea[name="message"]', `hello from ${name}`);
    await page.getByRole('button', { name: /sign/i }).click();
    const token = page.locator('main code').first();
    await expect(token).not.toBeEmpty();
    tokens.push(await token.innerText());
  }
  await openTranslated(page, '/verifymessage');
  const main = page.locator('main');
  const names = ['trone', 'trtwo'];
  for (const [i, name] of names.entries()) {
    await page.fill('textarea[name="payload"]', tokens[i]);
    await page.getByRole('button', { name: /verify/i }).click();
    await expect(main).toContainText(`@${name}`);
    await expect(main).toContainText(`hello from ${name}`);
  }
  // Nothing of the first result is left on screen.
  await expect(main).not.toContainText('@trone');
  await expect(main).not.toContainText('hello from trone');
  expect(problems).toEqual([]);
});
