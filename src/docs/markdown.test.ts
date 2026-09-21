import { describe, expect, it } from 'vitest';

// The build-time Markdown rendering every docs page goes through.
const { renderDoc } = await import('../../scripts/docs-markdown.mjs');

const render = (source: string, lang = 'en') =>
  renderDoc(source, { lang, file: 'page.md' });

describe('docs Markdown', () => {
  it('refuses HTML in the source, and shows it when it is written as code', () => {
    for (const source of [
      'Hi <img src=x onerror=alert(1)>',
      '<script>alert(1)</script>',
      '<div>block</div>',
      'text <!-- a comment -->',
      '## Title <b>x</b> {#title}',
    ])
      expect(() => render(source), source).toThrow(/HTML is not allowed/);
    // With its line, a table cell's too.
    expect(() => render('| a |\n|---|\n| <b>x</b> |')).toThrow(/page\.md:3:/);
    expect(render('Use `<script>` and a < b.').html).toBe(
      '<p>Use <code>&lt;script&gt;</code> and a &lt; b.</p>\n',
    );
  });

  it('gives each heading its stable id and lists the headings', () => {
    const { html, headings } = render(
      '## Scopes and `state` {#scopes}\n\ntext\n\n### Offline {#offline}',
    );
    expect(html).toContain(
      '<h2 id="scopes">Scopes and <code>state</code></h2>',
    );
    expect(html).toContain('<h3 id="offline">Offline</h3>');
    expect(headings).toEqual([
      { level: 2, id: 'scopes', text: 'Scopes and state' },
      { level: 3, id: 'offline', text: 'Offline' },
    ]);
  });

  it('refuses what a translation could break: a heading without an id, a title, a bare code block', () => {
    for (const [source, message] of [
      ['## Scopes', /stable id/],
      ['# Title {#title}', /## and ###/],
      ['#### Deep {#deep}', /## and ###/],
      ['## A {#a}\n\n## B {#a}', /used twice/],
      ['```\ncode\n```', /needs a language/],
      ['    indented code', /fenced code block/],
      ['## Bad id {#Bad_Id}', /stable id/],
    ] as const)
      expect(() => render(source), source).toThrow(message);
  });

  it('keeps a link to another docs page in the language it is read in', () => {
    const source =
      '[a](/docs/oauth2#scopes) [b](/docs) [c](https://hivesigner.com/authorized-apps) [d](https://hivesigner.com/api/me) [e](https://example.com/docs/x)';
    const { html, links } = render(source, 'zh-CN');
    expect(html).toContain('href="/docs/zh-cn/oauth2#scopes"');
    expect(html).toContain('href="/docs/zh-cn"');
    // The app's own pages stay on the host serving the build (staging too).
    expect(html).toContain('href="/authorized-apps"');
    expect(html).toContain('href="https://hivesigner.com/api/me"');
    expect(html).toContain('href="https://example.com/docs/x"');
    expect(render(source).html).toContain('href="/docs/oauth2#scopes"');
    // As written, for the checks that every link lands somewhere.
    expect(links[0]).toBe('/docs/oauth2#scopes');
  });

  it('lets a wide table scroll in its own box', () => {
    expect(render('| a | b |\n|---|---|\n| 1 | 2 |').html).toMatch(
      /^<div class="docs-table"><table>/,
    );
  });

  it('never turns a link into one that leaves the site', () => {
    expect(
      render('[a](https://hivesigner.com//evil.example/x)').html,
    ).toContain('href="https://hivesigner.com//evil.example/x"');
  });

  it('refuses images, which would load from anywhere in every copy of the page', () => {
    for (const source of [
      '![a](https://x.example/i.png)',
      '[![a](https://x.example/i.png)](/docs)',
      '| a |\n|---|\n| ![a](https://x.example/i.png) |',
    ])
      expect(() => render(source), source).toThrow(/images/);
  });
});
