import { expect, type Page, test } from '@playwright/test';
import { getConfig, mockHiveRpc } from '../fixtures/rpc';

// An app asks for a message signed (#84), as with Hive Keychain's
// requestSignBuffer, and gets the signature back on its callback. The
// signature itself is checked in the unit tests; this is the whole trip in
// the built app: the request screen, the passcode, the callback.

// A throwaway key pair, not an account on chain (the unit tests use it too).
const WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';
const USER = 'bufferone';
const PASSCODE = 'e2e-passcode';
const CALLBACK = 'https://site.example/signed';

async function setUp(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const auth = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[PUB, 1]],
  };
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_accounts': ([names]: string[][]) =>
      names.map((name) => ({
        name,
        memo_key: PUB,
        owner: auth,
        active: auth,
        posting: auth,
        json_metadata: '',
        posting_json_metadata: '',
      })),
  });
  await page.route(`${CALLBACK}**`, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>signed</p>' }),
  );
  return errors;
}

async function addAccount(page: Page) {
  await page.goto('/import', { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', USER);
  await page.fill('input[name="password"]', WIF);
  await page.fill('input[name="passcode"]', PASSCODE);
  await page.press('input[name="password"]', 'Enter');
  await page.waitForURL('**/accounts', { timeout: 20_000 });
  await page.locator('main [data-testid="account-row"]').first().waitFor();
}

const request = (message: string) =>
  `/sign-buffer?${new URLSearchParams({
    message,
    redirect_uri: CALLBACK,
    state: 'st-1',
  })}`;

test('a locked account signs in one step and the site gets the signature', async ({
  page,
}) => {
  const errors = await setUp(page);
  await addAccount(page);
  const message = 'Log in to site.example, nonce 7f3a';
  // A new document: the keys are gone from memory, the account is locked.
  await page.goto(request(message), { waitUntil: 'networkidle' });
  await expect(page.locator('main h1')).toContainText(
    'site.example asks you to sign a message.',
  );
  await expect(page.locator('main')).toContainText(message);
  await page.fill(`input[name="passcode-${USER}"]`, PASSCODE);
  await page.getByRole('button', { name: /^sign$/i }).click();
  await page.waitForURL(`${CALLBACK}?**`, { timeout: 20_000 });
  const answer = new URL(page.url()).searchParams;
  expect(answer.get('signature')).toMatch(/^[0-9a-f]{130}$/);
  expect(answer.get('public_key')).toBe(PUB);
  expect(answer.get('username')).toBe(USER);
  expect(answer.get('authority')).toBe('posting');
  expect(answer.get('state')).toBe('st-1');
  expect(errors).toEqual([]);
});

test('a Hivesigner token body is never signed', async ({ page }) => {
  const errors = await setUp(page);
  await addAccount(page);
  await page.goto(
    request(
      JSON.stringify({
        signed_message: { type: 'code', app: 'ecency.app' },
        authors: [USER],
        timestamp: 1726650000,
      }),
    ),
    { waitUntil: 'networkidle' },
  );
  await expect(page.getByRole('alert')).toContainText(/Hivesigner token/);
  await expect(page.getByRole('button', { name: /^sign$/i })).toHaveCount(0);
  await expect(page.locator(`input[name="passcode-${USER}"]`)).toHaveCount(0);
  expect(errors).toEqual([]);
});
