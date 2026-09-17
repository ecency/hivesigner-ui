import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

// The persistent navigation. It lives INSIDE the header bar and is shown on
// every screen at EVERY width: inline beside the brand once the bar is wide
// enough, and as a full-width scroll row under it on a phone. It must never be
// hidden at a breakpoint - the rewrite once rendered it only inside
// `sm:hidden`, so navigation vanished at 640px and above.
//
// Settings, About and the message tools moved to the footer: they are
// destinations a visitor reaches once, not sections they move between.
export function AppNav() {
  const { t } = useTranslation();

  const links = [
    { to: '/apps', label: t('footer.apps') },
    { to: '/accounts', label: t('footer.accounts') },
    { to: '/signs', label: t('footer.signs') },
    { to: '/developers', label: t('footer.developers') },
  ] as const;

  // The active item is marked with an underline, so the current section reads
  // at a glance rather than from a weight change alone.
  //
  // NO negative bottom margin. It was there to pull the 2px underline over the
  // bar's own 1px border, and that 1px of overhang was exactly what made the
  // nav overflow vertically and grow a scrollbar down the whole bar.
  const base =
    'inline-flex items-center border-b-2 border-transparent py-2.5 hover:text-ink';

  return (
    // `overflow-y-hidden` is not redundant with `overflow-x-auto`: setting
    // overflow on ONE axis makes the other compute to `auto` rather than stay
    // `visible`. That is how a single pixel of vertical overhang rendered a
    // scrollbar down the whole navigation bar at every width. The overhang is
    // gone now; this keeps the axis pinned so the next one cannot do it again.
    //
    // `scroll-row` then hides the horizontal bar, which is real at ~320px where
    // five items genuinely do not fit. The row still scrolls by wheel,
    // trackpad, touch and keyboard.
    <nav
      aria-label={t('footer.main_nav')}
      className="scroll-row -mx-1 flex items-center gap-4 overflow-x-auto overflow-y-hidden px-1 whitespace-nowrap text-[13px] text-muted lg:gap-6"
    >
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className={base}
          // The base classes are NOT repeated here: TanStack Router APPENDS
          // activeProps.className to the element's own className, so restating
          // them just duplicated `border-transparent` on the active item.
          //
          // `border-brand!` is load-bearing. Two border-colour utilities land
          // on the same element and Tailwind resolves that by EMIT ORDER, not
          // by the order they appear in the attribute, so `border-transparent`
          // from the base won and the active underline never rendered at all.
          activeProps={{
            className: 'border-brand! font-semibold text-ink',
          }}
        >
          {l.label}
        </Link>
      ))}
      <a
        href="https://docs.hivesigner.com/"
        target="_blank"
        rel="noopener noreferrer"
        className={base}
      >
        {t('footer.documentation')}
      </a>
    </nav>
  );
}
