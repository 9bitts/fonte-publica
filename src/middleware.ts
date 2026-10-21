import { NextResponse, type NextRequest } from 'next/server';
import { isEdgeCacheablePath, PUBLIC_PAGE_CACHE_CONTROL } from '@/lib/public-cache';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security';

/**
 * Rate limit em rotas caras que batem no Postgres (além das APIs JSON).
 * Em memória / single-instance — ver docs/PENDENCIAS.md.
 */
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip = clientIp(req.headers);

  if (path === '/busca') {
    const rl = rateLimit(`page:busca:${ip}`, 40, 60_000);
    if (!rl.ok) {
      return new NextResponse(
        'Muitas buscas em pouco tempo. Aguarde um minuto e tente de novo.',
        {
          status: 429,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }
  }

  if (path === '/rss') {
    const rl = rateLimit(`page:rss:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return new NextResponse(
        'Muitas requisições ao feed RSS. Aguarde um minuto e tente de novo.',
        {
          status: 429,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }
  }

  const res = NextResponse.next();
  if (isEdgeCacheablePath(path)) {
    // Next não troca este header pelo no-store do force-dynamic.
    // A borda do Railway guarda a página e o processo pode dormir.
    res.headers.set('Cache-Control', PUBLIC_PAGE_CACHE_CONTROL);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico).*)'],
};
