import { expect, type Page, test } from '@playwright/test';
import { dynamicGlobalProps, getConfig, mockHiveRpc } from '../fixtures/rpc';

// Password managers and the local passcode (#136). A manager keeps one
// password per username per site, and here that is the Hive key: a passcode
// field that reads as "the new password" gets offered as a replacement for
// the saved key. Managers decide from the live DOM (autocomplete tokens, which
// form a field belongs to, what a submit carries), so that is what is checked,
// in a real browser.

// A throwaway key pair, not an account on chain (the unit tests use it too).
const WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';

function userAccount(name: string) {
  const auth = (keys: [string, number][]) => ({
    weight_threshold: 1,
    account_auths: [],
    key_auths: keys,
  });
  return {
    name,
    memo_key: 'STM8888888888888888888888888888888888888888888888888',
    owner: auth([]),
    active: auth([]),
    posting: auth([[PUB, 1]]),
    json_metadata: '',
    posting_json_metadata: '',
  };
}

type Submits = { names: string[] }[];

async function setUp(page: Page) {
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
    'condenser_api.get_accounts': ([names]: string[][]) =>
      names.map(userAccount),
  });
  // Every form submission in the page, with the names of the fields the form
  // owns: that is what a manager captures when a form is submitted.
  await page.addInitScript(() => {
    const w = window as unknown as { __submits: Submits };
    w.__submits = [];
    document.addEventListener(
      'submit',
      (e) => {
        const form = e.target as HTMLFormElement;
        w.__submits.push({
          names: Array.from(form.elements)
            .map((el) => (el as HTMLInputElement).name)
            .filter(Boolean),
        });
      },
      true,
    );
  });
}

async function importWithPasscode(page: Page, name: string) {
  await page.goto('/import', { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', name);
  await page.fill('input[name="password"]', WIF);
  await page.fill('input[name="passcode"]', 'e2e-passcode');
  // Enter in the passcode field, the way people finish a form.
  await page.press('input[name="passcode"]', 'Enter');
  await page.waitForURL('**/accounts', { timeout: 20_000 });
}

test('import offers username and key as the login, and the passcode as nobody’s password', async ({
  page,
}) => {
  await setUp(page);
  await page.goto('/import', { waitUntil: 'networkidle' });
  const facts = await page.evaluate(() => {
    const key = document.querySelector(
      'input[name="password"]',
    ) as HTMLInputElement;
    const user = document.querySelector(
      'input[name="username"]',
    ) as HTMLInputElement;
    const pass = document.querySelector(
      'input[name="passcode"]',
    ) as HTMLInputElement;
    const login = key.form as HTMLFormElement;
    return {
      keyAutocomplete: key.getAttribute('autocomplete'),
      userAutocomplete: user.getAttribute('autocomplete'),
      userInLogin: user.form === login,
      passType: pass.type,
      passAutocomplete: pass.getAttribute('autocomplete'),
      passIgnored: pass.getAttribute('data-1p-ignore'),
      passInLogin: Array.from(login.elements).includes(pass),
      // iOS AutoFill groups by the <form> a field sits in, not by its owner,
      // and filled the key into the passcode (#162).
      passInsideLogin: login.contains(pass),
      passFormHoldsOnlyIt:
        !!pass.form &&
        pass.form !== login &&
        pass.form.elements.length === 1 &&
        pass.form.elements[0] === pass,
    };
  });
  expect(facts).toEqual({
    keyAutocomplete: 'current-password',
    userAutocomplete: 'username',
    userInLogin: true,
    passType: 'password',
    passAutocomplete: 'one-time-code',
    passIgnored: 'true',
    passInLogin: false,
    passInsideLogin: false,
    passFormHoldsOnlyIt: true,
  });
});

test('Enter in the passcode adds the account, and only the login form is ever submitted', async ({
  page,
}) => {
  await setUp(page);
  await importWithPasscode(page, 'pmimport');
  const submits = await page.evaluate(
    () => (window as unknown as { __submits: Submits }).__submits,
  );
  expect(submits).toEqual([{ names: ['username', 'password'] }]);
  // Added under the passcode, not in plaintext.
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('vuex__accounts') ?? '{}')
        .accountsKeychains?.pmimport?.password ?? '',
  );
  expect(stored.startsWith('{')).toBe(true);
});

test('Enter in the key submits the login form through the button outside it', async ({
  page,
}) => {
  await setUp(page);
  await page.goto('/import', { waitUntil: 'networkidle' });
  await page.getByRole('checkbox').uncheck();
  await page.fill('input[name="username"]', 'pmenterkey');
  await page.fill('input[name="password"]', WIF);
  await page.press('input[name="password"]', 'Enter');
  await page.waitForURL('**/accounts', { timeout: 20_000 });
  const submits = await page.evaluate(
    () => (window as unknown as { __submits: Submits }).__submits,
  );
  expect(submits).toEqual([{ names: ['username', 'password'] }]);
});

test('the unlock passcode is nobody’s password, and Enter unlocks', async ({
  page,
}) => {
  await setUp(page);
  await importWithPasscode(page, 'pmunlock');
  // A fresh load drops the in-memory keys, so the account has to be
  // unlocked; a page that needs the keys asks for the passcode in place.
  await page.goto('/auths', { waitUntil: 'networkidle' });
  const field = page.locator('input[name="passcode-pmunlock"]');
  await expect(field).toBeVisible();
  expect(await field.getAttribute('autocomplete')).toBe('one-time-code');
  expect(await field.getAttribute('data-1p-ignore')).toBe('true');
  expect(
    await field.evaluate(
      (el) =>
        !!(el as HTMLInputElement).form &&
        (el as HTMLInputElement).form?.elements.length === 1,
    ),
  ).toBe(true);
  await field.fill('e2e-passcode');
  await field.press('Enter');
  // Unlocked: the passcode form closes without an error.
  await expect(field).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
  const submits = await page.evaluate(
    () => (window as unknown as { __submits: Submits }).__submits,
  );
  expect(submits).toEqual([]);
});
