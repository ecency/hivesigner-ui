// The shared visual vocabulary, as Tailwind class recipes.
//
// Every screen was written with inline `style` objects, which cannot express a
// media query, which is why the app was a fixed 480px column that looked like a
// narrow strip on a desktop. These recipes replace those objects.
//
// They keep the palette unchanged, but they deliberately NORMALISE a scale that
// had drifted: buttons were 44, 48 and 50px tall on different screens, fields 44
// and 48, headings 19, 20 and 22. One value each is chosen here, so a few screens
// shift by a couple of pixels. That is intended; it is not a redesign, and no
// colour changes.
//
// Palette, unchanged: brand #E31337, borders #d1d9e0, muted text #59636e, ink
// #1f2328, page #f6f8fa, danger #cf222e on #ffebe9, warning #7a5300 on #fff8e6.

/** Page wrapper. Comfortable on a phone, roomier once there is width. */
export const page = 'flex flex-col gap-4 p-5 sm:gap-5 sm:p-6';

/** The standard white panel. */
export const card = 'rounded-xl border border-[#d1d9e0] bg-white p-4';

/** A tighter card, for list rows and collapsibles. */
export const cardTight =
  'rounded-xl border border-[#d1d9e0] bg-white px-3.5 py-3';

/** Page heading. Scales up a little once there is room. */
export const h1 = 'm-0 text-xl font-bold sm:text-2xl';

/** Secondary/explanatory text. */
// `m-0` because these are often used on <p>, whose UA margin would otherwise
// fight the flex gap; `break-words` because they frequently carry user input.
export const muted = 'm-0 text-sm break-words text-[#59636e]';
export const mutedXs = 'm-0 text-xs break-words text-[#59636e]';

/** Full-width primary action. */
// `cursor-pointer` belongs in the recipe: the inline styles it replaced set it,
// and Tailwind's preflight sets no cursor on a button, so every caller that
// forgot it silently lost the affordance.
export const btnPrimary =
  'inline-flex h-[50px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-[#E31337] px-5 text-base font-semibold text-white no-underline hover:bg-[#c8102f] disabled:cursor-not-allowed disabled:bg-[#f0a5b3]';

/** Secondary action, same metrics as the primary. */
export const btnSecondary =
  'inline-flex h-[50px] cursor-pointer items-center justify-center rounded-[10px] border border-[#d1d9e0] bg-white px-5 text-base font-semibold text-[#1f2328] no-underline hover:bg-[#f6f8fa]';

/** Everything a field needs EXCEPT a height. Use for a textarea or any control
 * that sizes itself: `${fieldBase} py-2` rather than `${field} h-auto`, which
 * only worked because Tailwind happened to emit .h-auto after .h-11. */
// `text-[#1f2328]` is load-bearing, not decoration: Tailwind's preflight sets
// `color: inherit` on input/select/textarea, so a control inside the `label`
// recipe would otherwise inherit its muted grey and render the user's own typed
// value in caption colour.
export const fieldBase =
  'w-full rounded-lg border border-[#d1d9e0] px-3 text-[15px] text-[#1f2328] box-border';

/** Single-line text input or select. */
export const field = `${fieldBase} h-11`;

/** Field label. */
export const label = 'flex flex-col gap-1 text-xs text-[#59636e]';

/** Error panel (role="alert"). */
// break-words: these render user-supplied values (a rejected redirect URI, a
// node error) that can be long and unbroken.
export const alertError =
  'rounded-xl border border-[#f0b3b3] bg-[#ffebe9] p-4 text-[13px] break-words text-[#cf222e]';

/** Warning / heads-up panel. */
export const alertWarn =
  'rounded-xl border border-[#f0d38a] bg-[#fff8e6] p-4 text-[13px] break-words text-[#7a5300]';

/** A form column: readable width, centred once the shell is wider than it. */
export const formColumn = 'mx-auto w-full sm:max-w-lg';

/** A list of cards that becomes a grid when there is width to use. */
export const cardGrid = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';

/** A row inside a card: label left, value right, wrapping on a phone. */
export const row =
  'flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12.5px]';

/** Monospace, for keys, ids and signatures. */
export const mono = 'font-mono break-all';
