import { test, expect } from '@playwright/test'
import { mockHiveRpc, getConfig, dynamicGlobalProps } from '../fixtures/rpc'

// The confirm-transaction page, logged out. The #96 regression (legacy sign URLs with non-Latin1
// characters going blank) is the headline case.

test.beforeEach(async ({ page }) => {
  await mockHiveRpc(page, {
    'condenser_api.get_config': getConfig,
    'condenser_api.get_dynamic_global_properties': dynamicGlobalProps,
  })
})

test('legacy /sign/comment with an em dash and emoji renders every operation row', async ({ page }) => {
  const title = 'Check — dash'
  const body = 'Body — é 🙂'
  const url =
    '/sign/comment?parent_author=&parent_permlink=hive&author=ecency&permlink=render-check' +
    `&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&json_metadata=%7B%7D`

  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(url, { waitUntil: 'networkidle' })

  // The operation is decoded and its fields are shown (not a blank page).
  const text = await page.locator('body').innerText()
  expect(text).toContain('render-check')
  expect(text).toContain('—') // em dash survives, the #96 fix
  expect(text).toContain('🙂') // emoji survives

  // No unregistered custom elements (the Node 24 auto-import trap) and no runtime errors.
  const unknown = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((el) => el instanceof HTMLUnknownElement)
      .map((el) => el.tagName.toLowerCase()),
  )
  expect(unknown).toEqual([])
  expect(errors).toEqual([])

  // The "invalid data" error must NOT be shown for a valid op.
  await expect(page.locator('.alert-error')).toHaveCount(0)
})

test('a vote sign page needs a posting key and offers Continue when logged out', async ({ page }) => {
  await page.goto('/sign/vote?author=ecency&permlink=render-check&weight=10000', {
    waitUntil: 'networkidle',
  })
  const text = await page.locator('body').innerText()
  expect(text).toContain('render-check')
  // Logged out: a Continue link into login, not an Approve button.
  await expect(page.locator('[data-e2e="login-continue"], a:has-text("Continue")').first()).toBeVisible()
})

test('an unknown operation shows the invalid-data error', async ({ page }) => {
  await page.goto('/sign/not-a-real-op?foo=bar', { waitUntil: 'networkidle' })
  // Nuxt styled it `.alert-error`; the React app marks it role="alert". Either
  // way there must be an error the user can see and no approve control.
  await expect(page.locator('[role="alert"], .alert-error').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /approve|continue|sign/i })).toHaveCount(0)
})
