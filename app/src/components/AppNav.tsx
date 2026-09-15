import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

// The persistent navigation the Nuxt app had (`hidden sm:flex` in
// components/Navigation.vue) and the React rewrite dropped. Without it a desktop
// user who lands on /sign or /accounts has no way to reach anything else.
//
// It is shown on every screen at every width: the phone layout puts it in a
// single scrollable row under the brand bar, and from `sm` up it sits inline.
export function AppNav() {
  const { t } = useTranslation();

  // Same destinations the Nuxt navigation offered. Docs is external.
  const links = [
    { to: '/apps', label: t('footer.apps') },
    { to: '/accounts', label: t('footer.accounts') },
    { to: '/signs', label: t('footer.signs') },
    { to: '/about', label: t('footer.about') },
  ] as const;

  return (
    <nav
      aria-label={t('footer.apps')}
      className="flex items-center gap-4 overflow-x-auto whitespace-nowrap px-5 py-2 text-[13px] text-[#59636e] sm:gap-5 sm:px-0 sm:py-0"
    >
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="hover:text-[#1f2328] hover:underline"
          activeProps={{ className: 'text-[#1f2328] font-semibold' }}
        >
          {l.label}
        </Link>
      ))}
      <a
        href="https://docs.hivesigner.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[#1f2328] hover:underline"
      >
        {t('footer.documentation')}
      </a>
    </nav>
  );
}
