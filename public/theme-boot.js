/*
 * Applies a saved light/dark choice BEFORE the first paint.
 *
 * Why a separate file rather than an inline <script>: the CSP is
 * `script-src 'self'`, so an inline script does not run at all, and a hash
 * would have to be kept in sync with this content by hand in nginx.conf -
 * where getting it wrong fails silently. A same-origin file is allowed as-is.
 *
 * Why at all: globals.css handles the DEFAULT ("follows your device") through
 * prefers-color-scheme with no JavaScript, but an explicit choice that
 * disagrees with the OS lives in localStorage, and the entry bundle only runs
 * after the page has already painted. Without this, someone who chose dark on
 * a light machine sees a white page first, on every load.
 *
 * Served as-is, NOT bundled: it is not transpiled and has no imports. Kept
 * deliberately tiny and dependency-free because it is render-blocking. It must
 * agree with initTheme() in src/lib/theme.ts, which re-applies the same value
 * once the bundle starts, so this failing or being blocked costs a flash and
 * nothing more. The key must match THEME_KEY there.
 */
(() => {
  try {
    const t = localStorage.getItem('hs_theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch {
    // storage blocked: the media query still covers the default
  }
})();
