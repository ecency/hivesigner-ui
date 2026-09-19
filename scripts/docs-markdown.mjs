// The docs Markdown, turned into HTML at build time. The rspack loader
// (docs-loader.cjs), Vitest (vitest.config.ts) and the prerender
// (prerender-meta.mjs) all call renderDoc, so the page the app shows and the
// HTML a crawler reads come from one place, and the browser never gets a
// Markdown parser.
//
// The source rules are enforced here rather than hoped for, because 24
// translations are written from these files: a heading without a stable id
// would break every link to it in some language, and raw HTML would be a way
// to put markup into the page.
import MarkdownIt from 'markdown-it';
import { docHref } from '../src/docs/pages.ts';

const ID = /\s*\{#([a-z0-9]+(?:-[a-z0-9]+)*)\}\s*$/;

class DocError extends Error {
  constructor(file, token, message) {
    const line = token?.map ? `:${token.map[0] + 1}` : '';
    super(`${file}${line}: ${message}`);
  }
}

/** Where a link to another docs page goes in `lang`, and to the app's own
    pages on whatever host serves this build. */
function localHref(href, lang) {
  // A single leading slash only: `//host` or `/\host` would leave the site.
  const internal = /^https:\/\/hivesigner\.com(\/(?![/\\]).*)$/.exec(href);
  if (internal && !internal[1].startsWith('/api/')) href = internal[1];
  const docs = /^\/docs(?:\/([a-z0-9-]+))?\/?(#[a-z0-9-]+)?$/.exec(href);
  if (!docs) return href;
  return docHref(docs[1] ?? 'index', lang) + (docs[2] ?? '');
}

function createRenderer(file, lang) {
  // html: false escapes any HTML in the source, so it shows as text.
  const md = new MarkdownIt({
    html: false,
    linkify: false,
    typographer: false,
  });
  const headings = [];
  const links = [];

  md.core.ruler.push('doc_rules', (state) => {
    const seen = new Set();
    state.tokens.forEach((token, i) => {
      if (token.type === 'code_block') {
        throw new DocError(
          file,
          token,
          'use a fenced code block with a language',
        );
      }
      // An image would load from wherever its source points, in every
      // reader of the HTML and the Markdown copies, and no translation check
      // covers it. The docs have none.
      if (token.children?.some((c) => c.type === 'image')) {
        throw new DocError(file, token, 'images are not allowed in the docs');
      }
      if (token.type === 'fence' && !token.info.trim()) {
        throw new DocError(
          file,
          token,
          'a code block needs a language, as in ```js',
        );
      }
      if (token.type !== 'heading_open') return;
      if (token.tag !== 'h2' && token.tag !== 'h3') {
        throw new DocError(
          file,
          token,
          `use ## and ### only (the title comes from pages.json), not ${token.tag}`,
        );
      }
      const inline = state.tokens[i + 1];
      const last = inline.children.at(-1);
      const match = last?.type === 'text' ? ID.exec(last.content) : null;
      if (!match) {
        throw new DocError(
          file,
          token,
          'a heading ends with a stable id, as in "## Scopes {#scopes}"',
        );
      }
      const id = match[1];
      if (seen.has(id))
        throw new DocError(file, token, `the id #${id} is used twice`);
      seen.add(id);
      last.content = last.content.slice(0, match.index);
      token.attrSet('id', id);
      headings.push({
        level: Number(token.tag.slice(1)),
        id,
        text: inline.children
          .filter((c) => c.type === 'text' || c.type === 'code_inline')
          .map((c) => c.content)
          .join('')
          .trim(),
      });
    });
  });

  const render = md.renderer.rules;
  const renderToken = (tokens, i, options, _env, self) =>
    self.renderToken(tokens, i, options);
  render.link_open = (tokens, i, options, env, self) => {
    const href = tokens[i].attrGet('href') ?? '';
    links.push(href);
    tokens[i].attrSet('href', localHref(href, lang));
    return renderToken(tokens, i, options, env, self);
  };
  // A wide table scrolls inside its own box instead of widening the page.
  render.table_open = () => '<div class="docs-table"><table>\n';
  render.table_close = () => '</table></div>\n';

  return { md, headings, links };
}

/**
 * One page's HTML, its headings (for the page's own contents list) and the
 * links it makes as written (the tests check that every docs link lands on a
 * page and a heading that exist).
 */
export function renderDoc(source, { lang = 'en', file = 'page.md' } = {}) {
  const { md, headings, links } = createRenderer(file, lang);
  const html = md.render(source);
  return { html, headings, links };
}

/** The language and page of a docs file: src/docs/<lang>/<slug>.md. */
export function docFileInfo(path) {
  const match = /[\\/]docs[\\/]([A-Za-z-]+)[\\/]([a-z0-9-]+)\.md$/.exec(path);
  if (!match)
    throw new Error(`${path}: not a docs page (src/docs/<lang>/<slug>.md)`);
  return { lang: match[1], slug: match[2] };
}
