import { expect, type Page, test } from '@playwright/test';
import {
  appAccount,
  dynamicGlobalProps,
  getConfig,
  mockHiveRpc,
} from '../fixtures/rpc';

// Cancel pressed while an unlock runs must stop the action that unlock was
// for. The passcode field sits on the request screen itself and one click
// unlocks and acts (#145). The key derivation behind it (scrypt) is
// synchronous: it freezes the page for a good part of a second. A click made
// during the freeze (Cancel here) waits in the browser's input queue and is
// handled only once the page is free again.
//
// unlockAccount yields one macrotask right before it tells the store the
// account is unlocked. That is what lets a queued Cancel run first: it sets
// the leave latch before the unlock's own continuation. It also reaches the
// Cancel link where it was when it was pressed, before the unlocked screen
// redraws with the passcode field gone and Cancel somewhere else. Without
// that yield the screen redraws first, the queued click lands on nothing,
// nothing sets the latch and the grant goes out for a user who cancelled.
//
// The clicks go in as raw mouse input at coordinates read beforehand. A
// locator click runs actionability checks in the page, which would wait the
// freeze out and send Cancel afterwards, when nothing is in flight. The
// lazy chunk of the account list is held back so the grant screen stays
// mounted after Cancel: unmounting also sets the latch, which would hide
// whether the navigation itself did. The unit tests hold the unlock with a
// gate on readKeys and cannot show any of this; only a real freeze can.

// A throwaway key pair, not an account on chain (the unit tests use it too).
const WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';
const USER = 'leaveone';
const PASSCODE = 'e2e-passcode';

function userAccount(name: string, granted: Set<string>) {
  const auth = (accounts: [string, number][] = []) => ({
    weight_threshold: 1,
    account_auths: accounts,
    key_auths: [[PUB, 1]],
  });
  return {
    name,
    memo_key: PUB,
    owner: { weight_threshold: 1, account_auths: [], key_auths: [] },
    active: auth(),
    posting: auth([...granted].sort().map((app) => [app, 1])),
    json_metadata: '',
    posting_json_metadata: '',
  };
}

/** Mocks, plus a count of the broadcasts the page sent so far and the
    errors the page ran into. */
async function setUp(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Nothing granted yet, so /authorize/new.app has a grant to make.
  const granted = new Set<string>();
  let broadcasts = 0;
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
    'condenser_api.get_accounts': ([names]: string[][]) =>
      names.map((n) =>
        n.endsWith('.app') ? appAccount(n, []) : userAccount(n, granted),
      ),
    'condenser_api.broadcast_transaction': () => {
      broadcasts += 1;
      granted.add('new.app');
      return null;
    },
  });
  return { broadcasts: () => broadcasts, errors };
}

async function addAccount(page: Page, name: string, passcode: string) {
  await page.goto('/import', { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', name);
  await page.fill('input[name="password"]', WIF);
  await page.fill('input[name="passcode"]', passcode);
  await page.press('input[name="password"]', 'Enter');
  await page.waitForURL('**/accounts', { timeout: 20_000 });
}

/** A screen for an account locked by the reload, passcode typed, with the
    account list's chunk held back and the two targets located: the screen's
    action and the link that leaves it. */
async function openLocked(
  page: Page,
  url = '/authorize/new.app',
  action = /^authorize$/i,
  away = (p: Page) => p.getByRole('link', { name: /^cancel$/i }),
) {
  await page.goto(url, { waitUntil: 'networkidle' });
  const passcode = page.locator(`input[name="passcode-${USER}"]`);
  await passcode.fill(PASSCODE);
  const authorize = page.getByRole('button', { name: action });
  await expect(authorize).toBeEnabled();
  const cancel = away(page);
  await expect(cancel).toBeVisible();
  // From here on every lazy chunk takes seconds to arrive, so the screen
  // Cancel leaves stays mounted well past the unlock.
  await page.route('**/static/js/async/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    await route.continue();
  });
  const centre = async (
    box: Promise<null | {
      x: number;
      y: number;
      width: number;
      height: number;
    }>,
  ) => {
    const b = await box;
    if (!b) throw new Error('target not laid out');
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  return {
    authorize: await centre(authorize.boundingBox()),
    cancel: await centre(cancel.boundingBox()),
  };
}

const settle = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

test('Cancel queued behind the unlock stops the grant', async ({ page }) => {
  const { broadcasts, errors } = await setUp(page);
  await addAccount(page, USER, PASSCODE);
  const at = await openLocked(page);
  // Sent together: the second click is queued while the first one's handler
  // is still deriving the key. Neither waits for anything in the page.
  await Promise.all([
    page.mouse.click(at.authorize.x, at.authorize.y),
    page.mouse.click(at.cancel.x, at.cancel.y),
  ]);
  // The unlock has landed once the passcode field is gone. What it went on
  // to do follows within a moment; the held chunk arrives 4s after Cancel.
  await expect(page.locator(`input[name="passcode-${USER}"]`)).toHaveCount(0, {
    timeout: 20_000,
  });
  await settle(6000);
  // Nothing went out for a user who cancelled. The queued Cancel reached its
  // link: the account list is up.
  expect(broadcasts()).toBe(0);
  expect(page.url()).toContain('/accounts');
  await expect(page.locator('main [data-testid="account-row"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('the same click without Cancel grants (the harness can broadcast)', async ({
  page,
}) => {
  const { broadcasts, errors } = await setUp(page);
  await addAccount(page, USER, PASSCODE);
  const at = await openLocked(page);
  await page.mouse.click(at.authorize.x, at.authorize.y);
  await expect(page.locator('main output')).toContainText(/authorized/i, {
    timeout: 20_000,
  });
  await settle(1000);
  expect(broadcasts()).toBe(1);
  expect(page.url()).toContain('/authorize/new.app');
  expect(errors).toEqual([]);
});

test('a link elsewhere queued behind a local sign-in wins', async ({
  page,
}) => {
  // The local sign-in moves on to its target once unlocked. The header's
  // Accounts link pressed during the unlock started first, so that is where
  // the user goes. (Switching accounts itself happens in place, #146.)
  const { errors } = await setUp(page);
  await addAccount(page, USER, PASSCODE);
  const at = await openLocked(
    page,
    '/login?redirect=%2Fauthorized-apps',
    /^sign in$/i,
    (p) => p.locator('header').getByRole('link', { name: /^accounts$/i }),
  );
  await Promise.all([
    page.mouse.click(at.authorize.x, at.authorize.y),
    page.mouse.click(at.cancel.x, at.cancel.y),
  ]);
  await expect(page.locator(`input[name="passcode-${USER}"]`)).toHaveCount(0, {
    timeout: 20_000,
  });
  await settle(6000);
  expect(new URL(page.url()).pathname).toBe('/accounts');
  await expect(page.locator('main [data-testid="account-row"]')).toHaveCount(1);
  // The sign-in click landed too: the account was unlocked, not just left.
  // Message signing shows its form only to an unlocked account (and asks
  // for the passcode otherwise); reached in-app, so the keys stay in memory.
  await page
    .locator('header')
    .getByRole('link', { name: /^signer$/i })
    .click();
  await page.getByRole('link', { name: /^sign message$/i }).click();
  await expect(page.getByRole('textbox')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(`input[name="passcode-${USER}"]`)).toHaveCount(0);
  expect(errors).toEqual([]);
});
