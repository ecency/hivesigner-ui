import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

// The persistent navigation the Nuxt app had (`hidden sm:flex` in
// components/Navigation.vue) and the React rewrite dropped. Without it a desktop
// user who lands on /sign or /accounts has no way to reach anything else.
//
// Shown on every screen at EVERY width, in its own bar under the brand bar: a
// scrollable row when the viewport is narrow, roomier when it is not. It must
// never be hidden at a breakpoint - that is the bug this component exists to fix.
export function AppNav() {
  const { t } = useTranslation();

  // Same destinations the Nuxt navigation offered. Docs is external.
  const links = [
    { to: '/apps', label: t('footer.apps') },
    { to: '/accounts', label: t('footer.accounts') },
    { to: '/signs', label: t('footer.signs') },
    { to: '/settings', label: t('footer.settings') },
    { to: '/about', label: t('footer.about') },
  ] as const;

  // The active item is marked with an underline that sits ON the bar's bottom
  // border, so the current section reads at a glance rather than from a weight
  // change alone. -mb-px pulls it over the border rather than below it.
  const base =
    'inline-flex items-center border-b-2 border-transparent py-2.5 -mb-px hover:text-ink';

  return (
    <nav
      aria-label="Main"
      className="-mx-1 flex items-center gap-4 overflow-x-auto px-1 whitespace-nowrap text-[13px] text-muted sm:gap-6"
    >
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className={base}
          activeProps={{
            className: `${base} border-brand font-semibold text-ink`,
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
