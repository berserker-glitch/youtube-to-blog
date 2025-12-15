// Markdown -> HTML conversion for WordPress REST API `content`.
// Uses dynamic imports to avoid ESM/CJS friction in Next.js server routes.

export async function markdownToHtml(markdown: string): Promise<string> {
  const md = (markdown || '').toString();
  const [{ unified }, remarkParse, remarkGfm, remarkRehype, rehypeStringify] =
    await Promise.all([
      import('unified'),
      import('remark-parse'),
      import('remark-gfm'),
      import('remark-rehype'),
      import('rehype-stringify'),
    ]);

  const file = await unified()
    .use(remarkParse.default)
    .use(remarkGfm.default)
    .use(remarkRehype.default, { allowDangerousHtml: true })
    .use(rehypeStringify.default, { allowDangerousHtml: true })
    .process(md);

  return String(file);
}






