// The shared visual vocabulary, as Tailwind class recipes.
//
// Every colour here is a TOKEN (`bg-surface`, `text-ink`, `border-line`, ...)
// defined in globals.css, never a hex literal. A literal cannot follow the
// theme, and the app has two of them; see the token comment in globals.css.
//
// The scale is deliberately normalised: buttons were 44, 48 and 50px tall on
// different screens, fields 44 and 48, headings 19, 20 and 22. One value each.

/** Page wrapper. The shell owns the side gutter, so this is vertical only. */
export const page = 'flex flex-col gap-4 py-6 sm:gap-5 sm:py-8';

/** The standard panel. */
export const card = 'rounded-xl border border-line bg-surface p-4 shadow-card';

/** A tighter panel, for list rows and collapsibles. */
export const cardTight =
  'rounded-xl border border-line bg-surface px-3.5 py-3 shadow-card';

/** Page heading. Scales up a little once there is room. */
export const h1 = 'm-0 text-xl font-bold sm:text-2xl';

/** Section heading, below h1. */
export const h2 = 'm-0 text-base font-semibold sm:text-lg';

/** Secondary/explanatory text. */
// `m-0` because these are often used on <p>, whose UA margin would otherwise
// fight the flex gap; `break-words` because they frequently carry user input.
export const muted = 'm-0 text-sm break-words text-muted';
export const mutedXs = 'm-0 text-xs break-words text-muted';

/** Full-width primary action. */
// `cursor-pointer` belongs in the recipe: the inline styles it replaced set it,
// and Tailwind's preflight sets no cursor on a button, so every caller that
// forgot it silently lost the affordance.
export const btnPrimary =
  'inline-flex h-[50px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-brand px-5 text-base font-semibold text-white no-underline transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-brand-muted';

/** Secondary action, same metrics as the primary. */
export const btnSecondary =
  'inline-flex h-[50px] cursor-pointer items-center justify-center rounded-[10px] border border-line bg-surface px-5 text-base font-semibold text-ink no-underline transition-colors hover:bg-subtle';

/** A small, quiet action: inline in a row, not a page-level commitment. */
export const btnGhost =
  'inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink no-underline transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:text-muted';

/** Everything a field needs EXCEPT a height. Use for a textarea or any control
 * that sizes itself: `${fieldBase} py-2` rather than `${field} h-auto`, which
 * only worked because Tailwind happened to emit .h-auto after .h-11. */
// `text-ink` and `bg-surface` are load-bearing, not decoration: Tailwind's
// preflight sets `color: inherit` on input/select/textarea, so a control inside
// the `label` recipe would otherwise inherit its muted grey and render the
// user's own typed value in caption colour.
export const fieldBase =
  'w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink box-border';

/** Single-line text input or select. */
export const field = `${fieldBase} h-11`;

/** Field label wrapper. */
export const label = 'flex flex-col gap-1 text-xs text-muted';

/** The visible name of a field, inside `label`. */
export const labelText = 'text-[13px] font-semibold text-ink';

/** Error panel (role="alert"). */
// break-words: these render user-supplied values (a rejected redirect URI, a
// node error) that can be long and unbroken.
export const alertError =
  'rounded-xl border border-danger-line bg-danger-bg p-4 text-[13px] break-words text-danger';

/** Warning / heads-up panel. */
export const alertWarn =
  'rounded-xl border border-warn-line bg-warn-bg p-4 text-[13px] break-words text-warn';

/** Success panel. */
export const alertOk =
  'rounded-xl border border-ok-line bg-ok-bg p-4 text-[13px] break-words text-ok';

/** A form column: readable width, centred once the shell is wider than it. */
export const formColumn = 'mx-auto w-full sm:max-w-lg';

/** A list of cards that becomes a grid when there is width to use. */
export const cardGrid = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';

/** A row inside a card: label left, value right, wrapping on a phone. */
export const row =
  'flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12.5px]';

/** Monospace, for keys, ids and signatures. */
export const mono = 'font-mono break-all';

/** The shell's horizontal gutter, shared by the bars and the content column so
 * they line up. 16px is the minimum at any width. */
export const gutter = 'mx-auto w-full max-w-5xl px-4 sm:px-6';
