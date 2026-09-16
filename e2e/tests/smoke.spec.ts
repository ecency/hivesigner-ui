import { test, expect } from '@playwright/test'

// Route reachability, security headers and asset handling. No mocks: this is the same check that
// gated the Phase 0 nginx switch (#99), now expressed so it runs against any BASE_URL.

const appRoutes = [
  '/',
  '/about',
  '/accounts',
  '/settings',
  '/import',
  '/login',
  '/developers',
  '/sign/vote?author=ecency&permlink=x&weight=10000',
  '/sign/op/WyJ2b3RlIix7InZvdGVyIjoiX19zaWduZXIiLCJhdXRob3IiOiJlY2VuY3kiLCJwZXJtbGluayI6InRlc3QiLCJ3ZWlnaHQiOjEwMDAwfV0',
  '/oauth2/authorize?client_id=ecency.app&redirect_uri=https%3A%2F%2Fecency.com&scope=posting',
  '/login-request/ecency.app',
  '/authorize/ecency.app',
  '/revoke/ecency.app',
  '/does-not-exist',
]

for (const route of appRoutes) {
  test(`serves the app shell for ${route}`, async ({ request, baseURL }) => {
    const res = await request.get(route)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('text/html')
    const headers = res.headers()
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBeTruthy()
    // baseURL is only referenced so the fixture is considered used across environments.
    expect(baseURL).toBeTruthy()
  })
}

// The hashed-asset prefix is a build detail: Nuxt served /_nuxt/, Rsbuild
// serves /static/. The contract is the behaviour, so the prefix is read from
// the shell rather than assumed.
async function hashedAssetPrefix(request: Parameters<Parameters<typeof test>[1]>[0]['request']) {
  const html = await (await request.get('/')).text()
  const asset = html.match(/(?:src|href)="(\/(?:_nuxt|static)\/[^"]+\.js)"/)?.[1]
  expect(asset, 'a hashed entry chunk referenced in the shell').toBeTruthy()
  return { asset: asset!, prefix: asset!.split('/').slice(0, 2).join('/') }
}

test('missing hashed asset is a 404, not the shell', async ({ request }) => {
  const { prefix } = await hashedAssetPrefix(request)
  const res = await request.get(`${prefix}/does-not-exist.js`)
  expect(res.status()).toBe(404)
})

test('hashed assets are cached for a year', async ({ request }) => {
  const { asset } = await hashedAssetPrefix(request)
  const res = await request.get(asset)
  expect(res.status()).toBe(200)
  expect(res.headers()['cache-control']).toContain('max-age=31536000')
})
