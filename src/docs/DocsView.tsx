import { useQuery } from '@tanstack/react-query';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useCallback, useEffect, useId, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  alertError,
  btnGhost,
  card,
  cardGrid,
  h1,
  h2,
  link,
  muted,
} from '@/components/ui';
import { isLanguage, type Language, languageInfo } from '@/i18n/languages';
import { applyMeta, fullTitle, siteOrigin } from '@/lib/page-meta';
import { docsIndexKey, docsPageKey } from '@/lib/query-keys';
import { englishIndex, hasPage, loadDocIndex, loadDocPage } from './content';
import { DocLink } from './DocLink';
import { DOC_SECTIONS, DOC_SLUGS, type DocSlug, docHref } from './pages';

const SOURCE = 'https://github.com/ecency/hivesigner-ui/blob/development';

const indexQuery = (lang: string) => ({
  queryKey: docsIndexKey(lang),
  queryFn: () => loadDocIndex(lang),
  staleTime: Number.POSITIVE_INFINITY,
});

/**
 * One docs page. The URL decides the language of the page (see path.ts); a
 * page that language has not translated yet is shown in English with a note,
 * under the same address, and is not offered to search engines there.
 */
export function DocsView({ lang, slug }: { lang: Language; slug: DocSlug }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { pathname, hash } = useRouterState({
    select: (s) => ({ pathname: s.location.pathname, hash: s.location.hash }),
  });

  const own = useQuery(indexQuery(lang));
  const translated = own.data ? hasPage(own.data, slug) : undefined;
  const pageLang = translated ? lang : 'en';
  const page = useQuery({
    queryKey: docsPageKey(pageLang, slug),
    queryFn: () => loadDocPage(pageLang, slug),
    enabled: translated !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // The same page in the language the app is shown in, when the page is
  // shown in another one.
  const appLang: Language = isLanguage(i18n.language) ? i18n.language : 'en';
  const theirs = useQuery({
    ...indexQuery(appLang),
    enabled: translated !== undefined && appLang !== pageLang,
  });
  const offer =
    translated !== undefined &&
    appLang !== pageLang &&
    theirs.data &&
    hasPage(theirs.data, slug)
      ? appLang
      : null;

  const titleOf = (s: DocSlug) =>
    (own.data?.pages[s] ?? englishIndex.pages[s])?.title ?? s;
  const info = own.data?.pages[slug] ?? englishIndex.pages[slug];
  const title = info?.title ?? slug;

  useEffect(() => {
    if (translated === undefined || !info) return;
    applyMeta(pathname, {
      title: fullTitle({
        title: info.title,
        description: info.description,
        indexable: translated,
      }),
      description: info.description,
      canonical: translated ? `${siteOrigin()}${docHref(slug, lang)}` : null,
    });
  }, [pathname, translated, info, slug, lang]);

  // A new page starts at its top, or at the heading its link names once the
  // page is there to scroll to.
  useEffect(() => {
    if (!page.data) return;
    const target = hash ? document.getElementById(hash) : null;
    if (target) target.scrollIntoView?.();
    else if (!hash) window.scrollTo?.(0, 0);
  }, [page.data, hash]);

  // Links inside the page are plain anchors in the rendered HTML: move to
  // this site's own pages without reloading it. One listener on the page's
  // body catches them all, keyboard activation included (it clicks too).
  const followLinks = useCallback(
    (body: HTMLDivElement | null) => {
      if (!body) return;
      const follow = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement).closest('a');
        if (
          !anchor ||
          anchor.target ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        )
          return;
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        e.preventDefault();
        router.navigate({ href: url.pathname + url.search + url.hash });
      };
      body.addEventListener('click', follow);
      return () => body.removeEventListener('click', follow);
    },
    [router],
  );

  const order = DOC_SLUGS.indexOf(slug);
  const previous = order > 0 ? DOC_SLUGS[order - 1] : null;
  const next = order < DOC_SLUGS.length - 1 ? DOC_SLUGS[order + 1] : null;
  const { htmlLang, rtl } = languageInfo(pageLang);

  return (
    <div className="flex flex-col gap-6 py-6 sm:py-8 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <DocsNav
        lang={lang}
        slug={slug}
        titleOf={titleOf}
        sectionOf={(key) =>
          own.data?.sections[key] ?? englishIndex.sections[key]
        }
        headings={page.data?.headings ?? []}
      />

      <article
        lang={htmlLang ?? pageLang}
        dir={rtl ? 'rtl' : 'ltr'}
        className="flex min-w-0 flex-col gap-4"
      >
        <h1 className={h1}>{title}</h1>

        {translated === false && (
          <p role="note" className={muted}>
            {t('docs.not_translated', {
              language: languageInfo(lang).name,
            })}
          </p>
        )}
        {offer && (
          <p role="note" className={muted}>
            <Trans
              i18nKey="docs.also_in"
              values={{ language: languageInfo(offer).name }}
              components={{
                lang: (
                  <DocLink href={docHref(slug, offer)} className={link}>
                    {languageInfo(offer).name}
                  </DocLink>
                ),
              }}
            />
          </p>
        )}

        {page.isError || own.isError ? (
          <div role="alert" className={`${alertError} flex flex-col gap-3`}>
            <span>{t('docs.load_failed')}</span>
            <button
              type="button"
              className={`${btnGhost} self-start`}
              onClick={() => (own.isError ? own.refetch() : page.refetch())}
            >
              {t('authorize.retry')}
            </button>
          </div>
        ) : page.data ? (
          // Rendered from this repository's own Markdown at build time, with
          // any HTML in the source escaped (scripts/docs-markdown.mjs).
          <div
            ref={followLinks}
            className="docs-prose"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time HTML from the docs Markdown, raw HTML escaped
            dangerouslySetInnerHTML={{ __html: page.data.html }}
          />
        ) : (
          <p className={muted}>…</p>
        )}

        {slug === 'index' && (
          <div className="flex flex-col gap-6">
            {DOC_SECTIONS.map((section) => (
              <section key={section.key} className="flex flex-col gap-3">
                <h2 className={h2}>
                  {own.data?.sections[section.key] ??
                    englishIndex.sections[section.key]}
                </h2>
                <div className={cardGrid}>
                  {section.pages.map((s) => (
                    <DocLink
                      key={s}
                      href={docHref(s, lang)}
                      className={`${card} flex flex-col gap-1 text-ink no-underline hover:border-line-strong`}
                    >
                      <span className="font-semibold">{titleOf(s)}</span>
                      <span className="text-[13px] leading-[1.5] text-muted">
                        {
                          (own.data?.pages[s] ?? englishIndex.pages[s])
                            ?.description
                        }
                      </span>
                    </DocLink>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-line pt-4 text-[13px]">
          {previous ? (
            <DocLink href={docHref(previous, lang)} className={link}>
              {t('docs.previous')}: {titleOf(previous)}
            </DocLink>
          ) : (
            <span />
          )}
          {next && (
            <DocLink href={docHref(next, lang)} className={link}>
              {t('docs.next')}: {titleOf(next)}
            </DocLink>
          )}
        </div>
        {pageLang === 'en' && (
          <a
            href={`${SOURCE}/src/docs/en/${slug}.md`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${muted} self-start underline underline-offset-2`}
          >
            {t('docs.edit')}
          </a>
        )}
      </article>
    </div>
  );
}

/** The pages, by section, with the current page's own headings under it. One
    list at every width: a phone opens it with the Contents button. */
function DocsNav({
  lang,
  slug,
  titleOf,
  sectionOf,
  headings,
}: {
  lang: Language;
  slug: DocSlug;
  titleOf: (slug: DocSlug) => string;
  sectionOf: (key: (typeof DOC_SECTIONS)[number]['key']) => string;
  headings: { level: number; id: string; text: string }[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const item =
    'block rounded-md px-2 py-1 text-[13.5px] text-muted no-underline hover:bg-subtle hover:text-ink';
  const current = 'bg-brand-tint font-semibold text-ink';

  return (
    <nav
      aria-label={t('docs.contents')}
      className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
    >
      <button
        type="button"
        // justify-between! outranks the recipe's own justify-center.
        className={`${btnGhost} w-full justify-between! lg:hidden`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        {t('docs.contents')}
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div
        id={listId}
        className={`${open ? 'flex' : 'hidden'} mt-3 flex-col gap-4 lg:mt-0 lg:flex`}
      >
        <DocLink
          href={docHref('index', lang)}
          className={`${item} ${slug === 'index' ? current : ''}`}
          aria-current={slug === 'index' ? 'page' : undefined}
        >
          {titleOf('index')}
        </DocLink>
        {DOC_SECTIONS.map((section) => (
          <div key={section.key} className="flex flex-col gap-1">
            <div className="px-2 text-[11.5px] font-semibold tracking-[0.08em] text-muted uppercase rtl:tracking-normal">
              {sectionOf(section.key)}
            </div>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {section.pages.map((s) => (
                <li key={s}>
                  <DocLink
                    href={docHref(s, lang)}
                    className={`${item} ${s === slug ? current : ''}`}
                    aria-current={s === slug ? 'page' : undefined}
                  >
                    {titleOf(s)}
                  </DocLink>
                  {s === slug && headings.some((h) => h.level === 2) && (
                    <ul className="m-0 mt-0.5 mb-1 flex list-none flex-col border-s border-line ps-2 ms-3">
                      {headings
                        .filter((h) => h.level === 2)
                        .map((h) => (
                          <li key={h.id}>
                            <a
                              href={`#${h.id}`}
                              className="block px-2 py-0.5 text-[12.5px] text-muted no-underline hover:text-ink"
                            >
                              {h.text}
                            </a>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
