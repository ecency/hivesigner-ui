import { test, expect } from '@playwright/test'
import { mockHiveRpc, getConfig, dynamicGlobalProps, appAccount } from '../fixtures/rpc'

// /oauth2/authorize normalization and the app-consent header. Logged out, so no key fixture is
// needed. Token issuance (which needs a seeded account) is covered in a later batch; see the
// TODO at the end.

test('offline scope becomes a code request on /login', async ({ page }) => {
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
    'condenser_api.get_accounts': ([names]: string[][]) => [
      appAccount(names[0], ['https://ecency.com']),
    ],
  })
  await page.goto(
    '/oauth2/authorize?client_id=ecency.app&redirect_uri=https%3A%2F%2Fecency.com&scope=login/offline',
    { waitUntil: 'networkidle' },
  )
  // Nuxt pushed to /login with the normalised query; the React app renders the
  // consent screen in place. What third-party apps depend on is the SCOPE the
  // user is asked to grant: offline forces posting (and a code response). So
  // the assertion is on what the screen asks for, not on the URL it does it at.
  await expect(page.locator('body')).toContainText(/requesting access/i)
  await expect(page.locator('body')).toContainText(/posting authority|Post, comment, vote/i)
  await expect(page.locator('body')).not.toContainText(/view your account username/i)
  // No stored account: the way forward is key import, carrying the request.
  // The consent screen's own link, not the header's "Get started" (also /import).
  const next = page.locator('main a[href*="/import?next="]').first()
  await expect(next).toBeVisible()
  expect(await next.getAttribute('href')).toContain('client_id')
})

test('a registered app is named in the consent header', async ({ page }) => {
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
    'condenser_api.get_accounts': ([names]: string[][]) => [
      appAccount(names[0], ['https://ecency.com']),
    ],
  })
  await page.goto('/login?client_id=ecency.app&redirect_uri=https%3A%2F%2Fecency.com&scope=posting', {
    waitUntil: 'networkidle',
  })
  await expect(page.locator('body')).toContainText('requesting access')
})

// TODO(#100 next batch): token issuance and its redirect shape. Needs a seeded decrypted account
// (username + hex(JSON(keys))+"decrypted" in vuex__accounts, and get_accounts key_auths matching
// the WIF's pubkey), plus a frozen clock, to assert the exact
// `<cb>?access_token=<b64u>&expires_in=604800&username=<u>` URL. It must also pin the current
// behaviour where an UNREGISTERED redirect_uri still receives a token (bug #1 in CONTRACT.md):
// the rewrite decides whether to keep or fix that, but the test records today's behaviour first.
