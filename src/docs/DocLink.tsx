import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DOC_LANGUAGES, hasDocs } from './content';
import { docHref } from './pages';

/** A link to a docs page by its path (see docHref). */
export function DocLink({
  href,
  ...rest
}: {
  href: string;
  className?: string;
  activeProps?: { className?: string };
  activeOptions?: { exact?: boolean };
  'aria-current'?: 'page';
  // A link whose text comes from the docs is in the docs' language, which is
  // not always the one the app is being shown in.
  lang?: string;
  dir?: 'ltr' | 'rtl';
  children: ReactNode;
}) {
  const splat = href.slice('/docs/'.length);
  return splat ? (
    <Link to="/docs/$" params={{ _splat: splat }} {...rest} />
  ) : (
    <Link to="/docs" {...rest} />
  );
}

/** A docs page in the language the app is shown in, when the docs have that
    language, else in English. */
export function useDocHref(slug = 'index'): string {
  const { i18n } = useTranslation();
  return docHref(
    slug,
    hasDocs(i18n.language, DOC_LANGUAGES) ? i18n.language : 'en',
  );
}
