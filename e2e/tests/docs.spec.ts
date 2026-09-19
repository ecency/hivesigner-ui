import { expect, test } from '@playwright/test';

// The docs at /docs: each page's HTML carries its content for readers that run
// no scripts, the old GitBook and /developers addresses lead to the new pages,
// and the app moves between pages without reloading.

test('a docs page is served with its own content and metadata', async ({
  request,
}) => {
  const res = await request.get('/docs/oauth2');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('<title>Sign in with OAuth2 · Hivesigner</title>');
  expect(html).toMatch(
    /<link rel="canonical" href="https:\/\/[^"]+\/docs\/oauth2"/,
  );
  expect(html).toMatch(
    /hreflang="x-default" href="https:\/\/[^"]+\/docs\/oauth2"/,
  );
  // The page itself, not only the shell.
  expect(html).toMatch(/<h1>Sign in with OAuth2<\/h1>/);
  expect(html).toContain('/oauth2/authorize?client_id=');
  expect(res.headers()['content-security-policy']).toContain(
    "frame-ancestors 'none'",
  );
});

test('the old addresses lead to the pages that replaced them', async ({
  request,
}) => {
  for (const [from, to] of [
    ['/developers', '/docs'],
    ['/developers/', '/docs'],
    ['/docs/h', '/docs'],
    ['/docs/h/', '/docs'],
    ['/docs/h/guides/get-started', '/docs'],
    ['/docs/h/guides/get-started/login-with-hivesigner', '/docs/how-it-works'],
    ['/docs/h/guides/get-started/integrate-hivesigner', '/docs/register-app'],
    ['/docs/h/guides/get-started/hivesigner-oauth2', '/docs/oauth2'],
    ['/docs/h/sdk/javascript', '/docs/sdk'],
    ['/docs/h/sdk/python.md', '/docs/sdk'],
    ['/docs/h/api/untitled', '/docs/api'],
    ['/docs/h/api/hive-api', '/docs/api'],
    ['/docs/h/use-cases/untitled', '/docs/image-uploads'],
    ['/docs/h/use-cases/backend-security', '/docs/tokens'],
    ['/docs/h/use-cases/login-without-authority', '/docs/login-only'],
    ['/docs/h/faq/questions', '/docs/faq'],
    ['/docs/h/no/such/page', '/docs'],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(
      new URL(res.headers().location, 'https://x.invalid').pathname,
      from,
    ).toBe(to);
  }
});

test('each page is also Markdown, listed in llms.txt, and in the sitemap', async ({
  request,
}) => {
  const llms = await (await request.get('/docs/llms.txt')).text();
  expect(llms).toMatch(
    /\[Sign in with OAuth2\]\(https:\/\/[^)]+\/docs\/oauth2\.md\)/,
  );
  const md = await request.get('/docs/oauth2.md');
  expect(md.status()).toBe(200);
  expect(md.headers()['content-type']).toContain('text/markdown');
  expect(md.headers()['x-robots-tag']).toBe('noindex');
  expect(await md.text()).toMatch(/^# Sign in with OAuth2\n/);
  expect((await request.get('/docs/no-such-page.md')).status()).toBe(404);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toMatch(/<loc>https:\/\/[^<]+\/docs\/oauth2<\/loc>/);
});

test('the docs move between pages without reloading', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/docs', { waitUntil: 'networkidle' });
  await expect(page.locator('main h1')).toHaveText('Hivesigner docs');
  // The prerendered copy is gone once the app has rendered.
  await expect(page.locator('[data-prerendered]')).toHaveCount(0);
  await page.evaluate(() => {
    (window as unknown as { sameDocument: boolean }).sameDocument = true;
  });
  const contents = page.getByRole('navigation', { name: 'Contents' });
  await contents.getByRole('link', { name: 'Sign in with OAuth2' }).click();
  await expect(page).toHaveURL(/\/docs\/oauth2$/);
  await expect(page.locator('main h1')).toHaveText('Sign in with OAuth2');
  await expect(page).toHaveTitle('Sign in with OAuth2 · Hivesigner');
  // One current page in the contents, not the docs home above it too.
  await expect(contents.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(contents.locator('[aria-current="page"]')).toHaveText(
    'Sign in with OAuth2',
  );
  // The focus moves to the new page's title, not back to the top of the site.
  await expect(page.locator('main h1')).toBeFocused();
  // A link inside the page, to a heading on another page.
  await page.locator('.docs-prose a[href^="/docs/tokens#"]').first().click();
  await expect(page).toHaveURL(/\/docs\/tokens#[a-z0-9-]+$/);
  await expect(page.locator('main h1')).toHaveText('Tokens');
  const id = new URL(page.url()).hash.slice(1);
  await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
  // The focus goes to the heading the link names, not the title above it.
  await expect(page.locator(`[id="${id}"]`)).toBeFocused();
  expect(
    await page.evaluate(
      () => (window as unknown as { sameDocument?: boolean }).sameDocument,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('a phone opens the contents with a button', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/docs/tokens', { waitUntil: 'networkidle' });
  const contents = page.getByRole('navigation', { name: 'Contents' });
  const button = contents.getByRole('button', { name: 'Contents' });
  await expect(contents.getByRole('link', { name: 'REST API' })).toBeHidden();
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await contents.getByRole('link', { name: 'REST API' }).click();
  await expect(page.locator('main h1')).toHaveText('REST API');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('a link to a heading on the same page moves the view, not the focus', async ({
  page,
}) => {
  await page.goto('/docs/sign-links', { waitUntil: 'networkidle' });
  const link = page
    .locator('.docs-prose a[href$="#callback-placeholders"]')
    .first();
  await link.click();
  await expect(page).toHaveURL(/#callback-placeholders$/);
  await expect(page.locator('#callback-placeholders')).toBeInViewport();
  await expect(page.locator('main h1')).not.toBeFocused();
});
