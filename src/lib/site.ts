import type { NextRequest } from 'next/server';

/**
 * URL canônica do site. Em produção no Railway, use NEXT_PUBLIC_SITE_URL
 * ou caia no host da requisição / RAILWAY_PUBLIC_DOMAIN.
 */
export function getSiteUrl(req?: NextRequest | Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.replace(/\/$/, '');
  if (railway) {
    return railway.startsWith('http') ? railway : `https://${railway}`;
  }

  if (req) {
    const proto = req.headers.get('x-forwarded-proto') ?? 'https';
    const host =
      req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000';
    if (host && !host.includes('localhost')) {
      return `${proto === 'http' ? 'http' : 'https'}://${host}`;
    }
    if (host) return `http://${host}`;
  }

  return 'http://localhost:3000';
}

export function wantsHtml(req: NextRequest | Request): boolean {
  const accept = req.headers.get('accept') ?? '';
  // Navegadores pedem text/html; leitores de feed pedem xml/rss/atom.
  return accept.includes('text/html') && !accept.includes('application/rss+xml');
}
