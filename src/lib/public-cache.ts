/** 12h na borda. O acervo muda no cron diário; repetir a mesma URL não precisa acordar o servidor. */
export const PUBLIC_PAGE_CACHE_CONTROL =
  'public, s-maxage=43200, stale-while-revalidate=86400';

const EXACT = new Set(['/', '/alertas', '/busca']);

export function isEdgeCacheablePath(pathname: string): boolean {
  if (EXACT.has(pathname)) return true;
  return (
    pathname.startsWith('/contratacao/') ||
    pathname.startsWith('/orgao/') ||
    pathname.startsWith('/municipio/') ||
    pathname.startsWith('/uf/')
  );
}
