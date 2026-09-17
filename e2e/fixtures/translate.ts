import type { Page } from '@playwright/test';

// Machine translation in the page, done the way Chrome's built-in translate
// does it: every text node is taken out of the document and a pair of <font>
// elements holding the translation is put in its place, and text added later
// is translated as it appears. Headless Chromium has no translate service, so
// this reproduces the DOM side of it, which is the part that breaks pages: the
// app still holds the text nodes that were taken out, and React removing one,
// inserting in front of one or rewriting one is what goes wrong.
//
// Like Chrome, it leaves alone anything marked translate="no" or
// class="notranslate", and form fields. The "translation" is the original text
// in «», so a test can tell translated text from text that never reached the
// translator.
//
// It also logs to the console, as it happens, every time the app touches a
// node that was taken out (see `watchTranslatedPage`):
// - React removed one, or inserted in front of one. Without the app's guard
//   that throws NotFoundError; with it the page survives, but the screen is
//   not what React meant.
// - React rewrote one. Nothing on screen changes, so the page goes on showing
//   the old text, translated.
// As it happens, not at the end: a page that is navigating away can no longer
// be read, and what it logs while it goes never arrives.
const PREFIX = 'translation: ';

export async function emulateChromeTranslate(page: Page) {
  await page.addInitScript((prefix: string) => {
    const taken = new WeakSet<Node>();
    const note = (problem: string) => console.log(`${prefix}${problem}`);

    const SKIP = 'script, style, textarea, input, select, option, noscript';
    const skipped = (node: Node) => {
      const el = node.parentElement;
      if (!el) return true;
      if (el.closest(SKIP)) return true;
      if (el.closest('font[data-translated]')) return true;
      const marked = el.closest('[translate]');
      if (marked && marked.getAttribute('translate') === 'no') return true;
      return !!el.closest('.notranslate');
    };
    const translate = (root: Node) => {
      const texts: Text[] = [];
      if (root.nodeType === Node.TEXT_NODE) {
        texts.push(root as Text);
      } else {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) texts.push(walker.currentNode as Text);
      }
      for (const text of texts) {
        if (!text.parentNode || !text.nodeValue?.trim() || skipped(text))
          continue;
        const outer = document.createElement('font');
        outer.setAttribute('data-translated', '');
        outer.style.verticalAlign = 'inherit';
        const inner = document.createElement('font');
        inner.style.verticalAlign = 'inherit';
        inner.textContent = `«${text.nodeValue}»`;
        outer.appendChild(inner);
        text.parentNode.replaceChild(outer, text);
        taken.add(text);
      }
    };

    const where = (node: Node) => {
      const el = node as Element;
      const cls = typeof el.className === 'string' ? el.className : '';
      return `<${el.nodeName.toLowerCase()} class="${cls.slice(0, 60)}">`;
    };
    const watch = () => {
      const proto = Node.prototype;
      const insertBefore = proto.insertBefore;
      const removeChild = proto.removeChild;
      proto.insertBefore = function <T extends Node>(
        this: Node,
        node: T,
        ref: Node | null,
      ): T {
        if (ref && taken.has(ref))
          note(`inserted in front of "${ref.nodeValue}" in ${where(this)}`);
        return insertBefore.call(this, node, ref) as T;
      };
      proto.removeChild = function <T extends Node>(this: Node, child: T): T {
        if (taken.has(child))
          note(`removed "${child.nodeValue}" from ${where(this)}`);
        return removeChild.call(this, child) as T;
      };
      const nodeValue = Object.getOwnPropertyDescriptor(proto, 'nodeValue');
      if (nodeValue?.get && nodeValue.set) {
        const { get, set } = nodeValue;
        Object.defineProperty(proto, 'nodeValue', {
          ...nodeValue,
          set(this: Node, value: string | null) {
            const before = get.call(this);
            if (taken.has(this) && value !== before)
              note(`"${before}" became "${value}", unseen`);
            set.call(this, value);
          },
        });
      }
    };

    // Chrome translates new content shortly after it appears, not in the
    // same task, so the app gets to run in between. `settled` says whether
    // everything that appeared so far has been through the translator, so a
    // test can wait for that before its next step.
    let started = false;
    let pending: Node[] = [];
    let timer = 0;
    const flush = () => {
      timer = 0;
      const nodes = pending;
      pending = [];
      for (const n of nodes) if (n.isConnected) translate(n);
    };
    const own = (n: Node) =>
      n instanceof Element && n.hasAttribute('data-translated');
    const start = () => {
      document.documentElement.classList.add('translated-ltr');
      document.documentElement.lang = 'es';
      translate(document.body);
      started = true;
      new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === 'characterData') pending.push(r.target);
          for (const n of r.addedNodes) if (!own(n)) pending.push(n);
        }
        if (pending.length && !timer) timer = window.setTimeout(flush, 30);
      }).observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    };
    (
      window as unknown as { __translationSettled: () => boolean }
    ).__translationSettled = () => started && !timer && pending.length === 0;
    // The app has started by `load` (its scripts are deferred), so the watch
    // wraps whatever the app installed and sees each call first. Translation
    // starts a little later, after the first render, as a user clicking
    // "Translate" (or the browser translating on its own) would.
    window.addEventListener('load', () => {
      // The app installs its guard before its first render. Without it a
      // conflict throws; installed later than this, it would wrap the watch
      // and hide the conflicts it rescues. Either way the page is not the one
      // this emulation is meant to check.
      // Only on the app's own pages (a callback page has no app).
      const app = document.querySelector('script[src*="/static/js/index."]');
      const guard = Symbol.for('hivesigner.translationGuard');
      if (app && !(Node.prototype as unknown as Record<symbol, unknown>)[guard])
        note('the translation guard was not installed before the page loaded');
      watch();
      setTimeout(start, 300);
    });
  }, PREFIX);
}

/**
 * Wait until the translator has been through everything on the page. Call it
 * after each step that changes the screen, before the next one: a step that
 * runs first would act on text the translator never saw.
 */
export async function translationSettled(page: Page) {
  await page.waitForFunction(() =>
    (
      window as unknown as { __translationSettled?: () => boolean }
    ).__translationSettled?.(),
  );
}

/**
 * Everything that went wrong in a translated page from now on, across
 * navigations: the touches above, and any error the page logged (React logs
 * the error a screen crashed with).
 */
export function watchTranslatedPage(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (m) => {
    const text = m.text();
    if (text.startsWith(PREFIX)) problems.push(text.slice(PREFIX.length));
    // Avatars are blocked by the RPC fixture; that is not the page's fault.
    else if (m.type() === 'error' && !/Failed to load resource/.test(text))
      problems.push(text.split('\n')[0]);
  });
  page.on('pageerror', (e) => problems.push(e.message));
  return problems;
}
