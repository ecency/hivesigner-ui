import { expect, type Page, test } from '@playwright/test';
import {
  appAccount,
  dynamicGlobalProps,
  getConfig,
  mockHiveRpc,
} from '../fixtures/rpc';
import {
  emulateChromeTranslate,
  translationSettled,
  watchTranslatedPage,
} from '../fixtures/translate';

// A translated page (Chrome's built-in translate) must keep working. The
// translator swaps the app's text for its own elements, and React updating
// that text is what used to take the account list and the signing screen
// down with NotFoundError. Each flow here runs translated and must end where
// it would untranslated, with no error, no text left stale, nothing React
// added or removed landing next to text the translator took away, and no
// account, app or host name inside translated text.
//
// The accounts, callback transfer, locked account, grant and verify flows
// change text while the screen is open, which is what used to break. The
// others cover screens that only render once, for the names and the errors.

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
  await translationSettled(page);
  await expect(page.locator('html.translated-ltr')).toHaveCount(1);
}

/** Text the translator produced: the emulator wraps it in «». */
const translated = (text: string) => `«${text}»`;

// The accounts, apps and hosts these flows use. The screens show them exactly,
// so none may end up inside text the translator rewrote.
const NAMES =
  /«[^»]*(?:trone|trtwo|trthree|granted\.app|new\.app|callback\.example)[^»]*»/g;

/** Visible text with the translator's «» taken out: stale text included. */
async function plainText(page: Page) {
  return (await page.locator('main').innerText()).replace(/[«»]/g, '');
}

async function expectNamesKept(page: Page) {
  const text = await page.locator('body').innerText();
  expect(text.match(NAMES)).toBeNull();
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

  // Switch to another account: "Current" moves with it, and is translated.
  await row(page, 'trone')
    .getByRole('button', { name: /switch an account/i })
    .click();
  await translationSettled(page);
  await expect(row(page, 'trone')).toContainText(translated('Current'));
  await expect(row(page, 'trthree')).not.toContainText(/current/i);

  // A wrong passcode, then the right one: the status line follows.
  await row(page, 'trtwo')
    .getByRole('button', { name: /unlock/i })
    .click();
  await translationSettled(page);
  const field = page.locator('input[name="passcode-trtwo"]');
  await field.fill('wrong');
  await field.press('Enter');
  await expect(row(page, 'trtwo').getByRole('alert')).toBeVisible();
  await translationSettled(page);
  await expect(row(page, 'trtwo').getByRole('alert')).toContainText('«');
  await field.fill('e2e-passcode');
  await field.press('Enter');
  await expect(field).toHaveCount(0);
  await translationSettled(page);
  await expect(row(page, 'trtwo')).toContainText(translated('Unlocked'));
  await expect(row(page, 'trtwo')).toContainText(translated('Current'));
  await expectNamesKept(page);

  // Remove one: the rest stay.
  page.once('dialog', (d) => d.accept());
  await row(page, 'trone')
    .getByRole('button', { name: /remove/i })
    .click();
  await expect(row(page, 'trone')).toHaveCount(0);
  await translationSettled(page);
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
  // The request's values are shown exactly, the copy around them translated.
  const main = page.locator('main');
  for (const value of ['1.000 HIVE', '@ecency', 'hi', 'callback.example'])
    await expect(main.getByText(value, { exact: true })).toHaveAttribute(
      'translate',
      'no',
    );
  await expect(main).toContainText(translated('Send '));
  await expect(main).toContainText(translated('Memo: '));
  await expectNamesKept(page);
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
  await expectNamesKept(page);
  await page.getByRole('button', { name: /approve/i }).click();
  await expect(page.locator('main')).toContainText(/successfully/i);
  await translationSettled(page);
  await expect(page.locator('main')).toContainText(
    translated('Transaction has been successfully broadcasted'),
  );
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
  await expectNamesKept(page);
  await page.getByRole('link', { name: /unlock/i }).click();
  await page.waitForURL('**/accounts?**');
  await translationSettled(page);
  await row(page, 'trtwo')
    .getByRole('button', { name: /unlock/i })
    .click();
  const field = page.locator('input[name="passcode-trtwo"]');
  await field.fill('e2e-passcode');
  await field.press('Enter');
  await page.waitForURL('**/sign/vote?**');
  await translationSettled(page);
  await expect(page.getByRole('button', { name: /approve/i })).toHaveText(
    translated('Approve'),
  );
  await expectNamesKept(page);
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
  await expect(page.locator('main')).toContainText('@granted.app');
  await expectNamesKept(page);
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
  await translationSettled(page);
  await expect(page.getByRole('alert')).toContainText('«');
  await expectNamesKept(page);
  await page.fill('input[name="password"]', WIF);
  await page.press('input[name="password"]', 'Enter');
  await page.waitForURL('**/accounts');
  expect(problems).toEqual([]);
});

test('grant: authorizing an app waits for the grant, then returns to the login', async ({
  page,
}) => {
  const problems = await setUp(page);
  await addAccount(page, 'trone');
  await openTranslated(
    page,
    `/authorize/new.app?redirect_uri=${encodeURIComponent(CALLBACK)}&scope=posting`,
  );
  await expectNamesKept(page);
  await page.getByRole('button', { name: /authorize/i }).click();
  // Granted, and waiting to see the grant on chain: the ellipsis shows, and
  // goes away while the screen is open.
  const done = page.locator('main output');
  await expect(done).toContainText('…');
  await translationSettled(page);
  await expect(done).toContainText(translated(' is authorized.'));
  await expect(done.locator('[translate="no"]')).toHaveText('new.app');
  await expectNamesKept(page);
  await page.waitForURL('**/login?**', { timeout: 30_000 });
  await translationSettled(page);
  await expect(page.locator('main')).toContainText('@new.app');
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
  for (const [i, name] of ['trone', 'trtwo'].entries()) {
    await page.fill('textarea[name="payload"]', tokens[i]);
    await page.getByRole('button', { name: /verify/i }).click();
    await expect(main).toContainText(`@${name}`);
    await expect(main).toContainText(`hello from ${name}`);
    // The result is on screen and the translator has been through it
    // before the next check replaces it.
    await translationSettled(page);
    await expect(page.getByRole('alert')).toContainText(
      translated('Signature is valid for '),
    );
    await expectNamesKept(page);
  }
  // Nothing of the first result is left on screen, translated or not.
  const left = await plainText(page);
  expect(left).not.toContain('@trone');
  expect(left).not.toContain('hello from trone');
  expect(problems).toEqual([]);
});

test('the guard keeps a page up when a translator has moved a node', async ({
  page,
}) => {
  const problems = await setUp(page);
  await openTranslated(page, '/about');
  const outcome = await page.evaluate(() => {
    const parent = document.createElement('div');
    document.body.append(parent);
    // Taken out and replaced, as Chrome does.
    const gone = document.createTextNode('gone');
    parent.append(gone);
    parent.replaceChild(document.createElement('font'), gone);
    // Moved deeper, into an element of the translator's.
    const deep = document.createTextNode('deep');
    const wrapper = document.createElement('font');
    parent.append(wrapper);
    wrapper.append(deep);
    const errors: string[] = [];
    const attempt = (run: () => unknown) => {
      try {
        run();
      } catch (e) {
        errors.push((e as Error).name);
      }
    };
    const added = document.createElement('span');
    attempt(() => parent.insertBefore(added, gone));
    attempt(() => parent.removeChild(gone));
    const before = document.createElement('i');
    attempt(() => parent.insertBefore(before, deep));
    attempt(() => parent.removeChild(deep));
    // A node that belongs somewhere else entirely is still refused.
    attempt(() => parent.removeChild(document.body));
    const shape = Array.from(parent.childNodes, (n) => n.nodeName);
    parent.remove();
    return { errors, shape, deepGone: deep.parentNode === null };
  });
  expect(outcome).toEqual({
    errors: ['NotFoundError'],
    shape: ['FONT', 'I', 'FONT', 'SPAN'],
    deepGone: true,
  });
  // The page itself saw nothing it could not handle.
  expect(problems).toEqual([]);
});
