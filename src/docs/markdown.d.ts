// A docs page, rendered at build time by scripts/docs-markdown.mjs.
declare module '*.md' {
  const page: import('./content').RenderedDoc;
  export default page;
}
