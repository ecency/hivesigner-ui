import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Crawlers and link unfurlers read the shell and run nothing, so the shell
// alone has to describe the site. The Nuxt app shipped an empty description
// and the first React shell shipped no icon at all; this pins what a share of
// hivesigner.com shows.
const html = readFileSync(new URL('../template.html', import.meta.url), 'utf8');
const attr = (selector: RegExp) => html.match(selector)?.[1];

describe('template.html', () => {
  it('has a title and a real description', () => {
    expect(attr(/<title>([^<]+)<\/title>/)).toMatch(/Hivesigner.+keys/);
    expect(
      attr(/<meta name="description" content="([^"]+)"/)?.length ?? 0,
    ).toBeGreaterThan(80);
  });

  it('carries Open Graph and Twitter tags with an absolute, build-time site URL', () => {
    for (const tag of [
      'og:type',
      'og:site_name',
      'og:title',
      'og:description',
      'og:url',
      'og:image',
      'og:image:width',
      'og:image:height',
    ]) {
      expect(html, tag).toContain(`property="${tag}"`);
    }
    for (const tag of [
      'twitter:card',
      'twitter:title',
      'twitter:description',
      'twitter:image',
    ]) {
      expect(html, tag).toContain(`name="${tag}"`);
    }
    expect(attr(/property="og:image" content="([^"]+)"/)).toBe(
      '<%= siteUrl %>/og-image.png',
    );
    expect(attr(/rel="canonical" href="([^"]+)"/)).toBe('<%= siteUrl %>/');
  });

  it('links icons, a touch icon and a manifest that exist in public/', () => {
    for (const path of [
      '/favicon.png',
      '/icons/icon-16.png',
      '/apple-touch-icon.png',
      '/manifest.json',
      '/og-image.png',
    ]) {
      expect(html, path).toContain(`"${path}"`);
      expect(
        () => readFileSync(new URL(`../public${path}`, import.meta.url)),
        path,
      ).not.toThrow();
    }
    for (const path of ['/robots.txt', '/sitemap.xml']) {
      expect(
        () => readFileSync(new URL(`../public${path}`, import.meta.url)),
        path,
      ).not.toThrow();
    }
  });

  it('keeps robots.txt and the sitemap in agreement with the page table', async () => {
    const robots = readFileSync(
      new URL('../public/robots.txt', import.meta.url),
      'utf8',
    );
    const sitemap = readFileSync(
      new URL('../public/sitemap.xml', import.meta.url),
      'utf8',
    );
    const { metaFor } = await import('./lib/page-meta');
    for (const p of ['/apps', '/developers', '/about', '/signs']) {
      expect(robots, p).toContain(`Allow: ${p}`);
      expect(sitemap, p).toContain(`<loc>https://hivesigner.com${p}</loc>`);
      expect(metaFor(p).indexable).toBe(true);
    }
    for (const p of [
      '/sign/',
      '/login',
      '/oauth2/',
      '/authorize/',
      '/revoke/',
      '/import',
      '/accounts',
      '/settings',
    ]) {
      expect(robots, p).toContain(`Disallow: ${p}`);
      expect(metaFor(p).indexable).toBe(false);
    }
  });
});
