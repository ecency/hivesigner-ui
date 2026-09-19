import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Trans, useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/Brand';
import { LanguageSelect } from '@/components/LanguageSelect';
import { gutter } from '@/components/ui';
import { DOC_LANGUAGES, hasDocs } from '@/docs/content';
import { DocLink, useDocHref } from '@/docs/DocLink';
import { docHref } from '@/docs/pages';
import { parseDocPath } from '@/docs/path';

const GITHUB = 'https://github.com/ecency/hivesigner-ui';

/**
 * Site footer: the brand line and every destination that is not a section of
 * the app. NOT a <nav>: the header nav is the navigation landmark, and a second
 * one made every page report two.
 */
export function AppFooter() {
  const { t } = useTranslation();
  const docs = useDocHref();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const item = 'text-[13px] text-muted no-underline hover:text-ink';

  const internal = [
    { to: '/apps', label: t('footer.apps') },
    { to: '/accounts', label: t('footer.accounts') },
    { to: '/signs', label: t('footer.signs') },
    { to: '/authorized-apps', label: t('footer.authorized_apps') },
    { to: '/signmessage', label: t('footer.sign_message') },
    { to: '/verifymessage', label: t('footer.verify_message') },
    { to: '/settings', label: t('footer.settings') },
    { to: '/about', label: t('footer.about') },
  ] as const;

  return (
    <footer className="mt-10 border-t border-line bg-surface">
      <div
        className={`${gutter} flex flex-col gap-6 py-7 sm:flex-row sm:items-start sm:justify-between sm:gap-10`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-ink">
            <BrandMark size={20} />
            <span className="text-[15px] font-bold">Hivesigner</span>
          </div>
          <p className="m-0 text-[12.5px] text-muted">
            {/* ONE key for the whole sentence: split into "Built with", "by the"
                and "team" it would be untranslatable, because word order moves. */}
            <Trans
              i18nKey="footer.built_by"
              // NOT `link`: html-parse-stringify, which Trans uses, treats
              // <link> as a VOID element, so the anchor rendered empty and
              // "Ecency" fell outside it. The first footer test caught it.
              components={{
                heart: <span className="text-brand" />,
                ecency: (
                  // The text here is a fallback only: Trans replaces the
                  // children with whatever the translation puts between <link>
                  // and </link>.
                  <a
                    href="https://ecency.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-ink"
                  >
                    Ecency
                  </a>
                ),
              }}
            />
          </p>
          {/* Where people look for it on any site, and on every page: someone
              who landed in a language they cannot read must not have to find
              Settings first. */}
          <LanguageSelect
            className="mt-2 w-full max-w-[220px]"
            // On a docs page the page follows: the same page in the new
            // language, or in English while the docs do not have it.
            onPicked={(applied, lang) => {
              const doc = parseDocPath(pathname);
              if (!applied || !doc) return;
              navigate({
                href: docHref(
                  doc.slug,
                  hasDocs(lang, DOC_LANGUAGES) ? lang : 'en',
                ),
                replace: true,
              });
            }}
          />
        </div>

        {/* Two columns on a phone, three from sm: eleven short links, so a
            single column would run taller than the content above it. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 sm:grid-cols-3 sm:gap-x-10">
          {internal.map((l) => (
            <Link key={l.to} to={l.to} className={item}>
              {l.label}
            </Link>
          ))}
          <DocLink href={docs} className={item}>
            {t('footer.documentation')}
          </DocLink>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className={item}
          >
            {t('footer.github')}
          </a>
        </div>
      </div>
    </footer>
  );
}
