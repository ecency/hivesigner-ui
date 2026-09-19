// Rspack loader for the docs pages: src/docs/<lang>/<slug>.md becomes a module
// whose default export is the rendered page (see docs-markdown.mjs).
module.exports = function docsLoader(source) {
  const done = this.async();
  // The rendered links depend on the page list too (docHref).
  this.addDependency(
    require('node:path').join(__dirname, '../src/docs/pages.ts'),
  );
  import('./docs-markdown.mjs')
    .then(({ renderDoc, docFileInfo }) => {
      const { lang } = docFileInfo(this.resourcePath);
      const page = renderDoc(source, { lang, file: this.resourcePath });
      done(null, `export default ${JSON.stringify(page)};`);
    })
    .catch(done);
};
