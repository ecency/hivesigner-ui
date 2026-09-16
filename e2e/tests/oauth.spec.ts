import { expect, test } from '@playwright/test';
import {
  appAccount,
  dynamicGlobalProps,
  getConfig,
  mockHiveRpc,
} from '../fixtures/rpc';

// /oauth2/authorize normalization and the app-consent header. Logged out, so no key fixture is
// needed. Token issuance (which needs a seeded account) is a Vitest route test; see the note at
// the end.

// response_type is not visible on the consent screen; its normalisation is a
// unit test (lib/oauth.test.ts). What is observable is the scope asked for.
test('offline scope asks for posting authority', async ({ page }) => {
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
    'condenser_api.get_accounts': ([names]: string[][]) => [
      appAccount(names[0], ['https://ecency.com']),
    ],
  });
  await page.goto(
    '/oauth2/authorize?client_id=ecency.app&redirect_uri=https%3A%2F%2Fecency.com&scope=login/offline',
    { waitUntil: 'networkidle' },
  );
  // What third-party apps depend on is the SCOPE the user is asked to grant:
  // offline forces posting (and a code response). So the assertion is on what
  // the screen asks for, not on the URL it does it at.
  await expect(page.locator('body')).toContainText(/requesting access/i);
  await expect(page.locator('body')).toContainText(
    /posting authority|Post, comment, vote/i,
  );
  await expect(page.locator('body')).not.toContainText(
    /view your account username/i,
  );
  // No stored account: the way forward is key import, carrying the request.
  // The consent screen's own link, not the header's "Get started" (also /import).
  const next = page.locator('main a[href*="/import?next="]').first();
  await expect(next).toBeVisible();
  expect(await next.getAttribute('href')).toContain('client_id');
});

test('a registered app is named in the consent header', async ({ page }) => {
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
    'condenser_api.get_accounts': ([names]: string[][]) => [
      appAccount(names[0], ['https://ecency.com']),
    ],
  });
  await page.goto(
    '/login?client_id=ecency.app&redirect_uri=https%3A%2F%2Fecency.com&scope=posting',
    {
      waitUntil: 'networkidle',
    },
  );
  await expect(page.locator('body')).toContainText('requesting access');
  // The client id is the part of the identity the app cannot choose; it must
  // be on the screen, and so must the callback host the token will go to.
  await expect(page.locator('body')).toContainText('@ecency.app');
  await expect(page.locator('body')).toContainText('ecency.com');
});

test('a site with no app account can ask to confirm the username', async ({
  page,
}) => {
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
    'condenser_api.get_accounts': () => [],
  });
  // hivesearcher and the like: no client_id, a callback, login only.
  await page.goto(
    '/oauth2/authorize?redirect_uri=https%3A%2F%2Fhivesearcher.example%2Fcb&scope=login',
    { waitUntil: 'networkidle' },
  );
  await expect(page.locator('body')).toContainText('hivesearcher.example');
  await expect(page.locator('body')).toContainText(
    /confirm your Hive username/i,
  );
  await expect(page.locator('body')).toContainText(
    /view your account username/i,
  );
  await expect(page.locator('body')).not.toContainText(/incomplete/i);
});

// Token issuance and the exact redirect URL need a stored account and a frozen clock, so they
// are pinned in src/components/AuthorizeConsent.test.tsx and src/lib/oauth.test.ts rather than
// here: this suite stays logged out so it can run against any deployment.
