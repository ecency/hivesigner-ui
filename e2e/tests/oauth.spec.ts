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
  // /oauth2/authorize pushes to /login; offline forces response_type=code and scope=posting.
  // With no stored account, before-login then forwards /login to /import, carrying the query.
  await expect(page).toHaveURL(/\/(login|import)\?/)
  const url = new URL(page.url())
  expect(url.searchParams.get('response_type')).toBe('code')
  expect(url.searchParams.get('scope')).toBe('posting')
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
