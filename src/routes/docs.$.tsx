import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsView } from '@/docs/DocsView';
import { parseDocPath } from '@/docs/path';

// /docs/<slug>, /docs/<lang> and /docs/<lang>/<slug> (see docs/path.ts).
export const Route = createFileRoute('/docs/$')({
  beforeLoad: ({ params }) => {
    if (!parseDocPath(`/docs/${params._splat ?? ''}`)) throw notFound();
  },
  component: DocsPage,
});

function DocsPage() {
  const { _splat } = Route.useParams();
  const doc = parseDocPath(`/docs/${_splat ?? ''}`);
  if (!doc) return null;
  // Keyed: the contents list closes and the queries restart on a new page.
  return (
    <DocsView key={`${doc.lang}/${doc.slug}`} lang={doc.lang} slug={doc.slug} />
  );
}
