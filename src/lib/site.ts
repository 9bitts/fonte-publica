/**
 * URL canônica do site. Em produção, NÃO confia em Host / X-Forwarded-Host
 * (evita envenenar links absolutos do RSS).
 */
export function getSiteUrl(req?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.replace(/\/$/, '');
  if (railway) {
    return railway.startsWith('http') ? railway : `https://${railway}`;
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    // Sem URL configurada: fallback estável em vez de confiar no Host.
    return 'https://fontepublica.org';
  }

  if (req) {
    const proto = req.headers.get('x-forwarded-proto') ?? 'http';
    const host = req.headers.get('host') ?? 'localhost:3000';
    return `${proto === 'https' ? 'https' : 'http'}://${host}`;
  }

  return 'http://localhost:3000';
}

export function wantsHtml(req: Request): boolean {
  const accept = req.headers.get('accept') ?? '';
  // Navegadores pedem text/html; leitores de feed pedem xml/rss/atom.
  return accept.includes('text/html') && !accept.includes('application/rss+xml');
}
