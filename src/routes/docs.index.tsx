import { createFileRoute } from '@tanstack/react-router';
import { DocsView } from '@/docs/DocsView';

// The docs home in English. Every other docs page is docs.$.tsx.
export const Route = createFileRoute('/docs/')({
  component: () => <DocsView lang="en" slug="index" />,
});
