import { expect, test } from '@playwright/test';

// Route reachability, security headers and asset handling. No mocks. Every published route must
// serve the app shell with the security headers nginx.conf sets, whatever BASE_URL it runs against.

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
];

for (const route of appRoutes) {
  test(`serves the app shell for ${route}`, async ({ request, baseURL }) => {
    const res = await request.get(route);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
    const headers = res.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBeTruthy();
    // baseURL is only referenced so the fixture is considered used across environments.
    expect(baseURL).toBeTruthy();
  });
}

// The hashed-asset prefix (/static/ today) is a build detail. The contract is
// the behaviour, so the prefix is read from the shell rather than assumed.
async function hashedAssetPrefix(
  request: Parameters<Parameters<typeof test>[1]>[0]['request'],
) {
  const html = await (await request.get('/')).text();
  const asset = html.match(/(?:src|href)="(\/[a-z_]+\/[^"]+\.js)"/)?.[1] ?? '';
  expect(asset, 'a hashed entry chunk referenced in the shell').toBeTruthy();
  return { asset, prefix: asset.split('/').slice(0, 2).join('/') };
}

test('missing hashed asset is a 404, not the shell', async ({ request }) => {
  const { prefix } = await hashedAssetPrefix(request);
  // A name no cache can already hold: a fixed one could be answered from a
  // cache filled before the current config was deployed.
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const res = await request.get(`${prefix}/does-not-exist-${unique}.js`);
  expect(res.status()).toBe(404);
  // Never cacheable: a miss that is kept stays a miss after the file exists.
  expect(res.headers()['cache-control']).toBe('no-store');
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
});

test('hashed assets are cached for a year', async ({ request }) => {
  const { asset } = await hashedAssetPrefix(request);
  const res = await request.get(asset);
  expect(res.status()).toBe(200);
  expect(res.headers()['cache-control']).toContain('max-age=31536000');
});
