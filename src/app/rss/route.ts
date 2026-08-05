import { NextRequest, NextResponse } from 'next/server';
import { formatCentavos, formatDateBr } from '@/lib/format';
import { rateLimit } from '@/lib/rate-limit';
import { searchContratacoes } from '@/lib/search';
import { clientIp } from '@/lib/security';
import { getSiteUrl, wantsHtml } from '@/lib/site';
import { buscaQuerySchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(req: NextRequest) {
  // Clique no menu do browser → página explicativa, não XML cru.
  if (wantsHtml(req)) {
    const qs = req.nextUrl.searchParams.toString();
    const target = qs ? `/alertas?${qs}` : '/alertas';
    return NextResponse.redirect(new URL(target, req.url));
  }

  const ip = clientIp(req.headers);
  const rl = rateLimit(`api:rss:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return new NextResponse('Rate limit excedido', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const site = getSiteUrl(req);
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = buscaQuerySchema.safeParse({ ...params, limit: params.limit ?? '30' });

  const titleParts = ['Fonte Pública — alerta'];
  if (parsed.success) {
    if (parsed.data.q) titleParts.push(`q=${parsed.data.q}`);
    if (parsed.data.uf) titleParts.push(`UF=${parsed.data.uf}`);
  }

  let itemsXml = '';
  try {
    if (parsed.success) {
      const result = await searchContratacoes(parsed.data);
      itemsXml = result.items
        .map((item) => {
          const link = `${site}/contratacao/${item.id}`;
          const desc = [
            item.modalidadeNome,
            item.ufSigla,
            formatCentavos(BigInt(item.valorEstimado)),
            item.orgao.razaoSocial,
          ]
            .filter(Boolean)
            .join(' · ');
          return `
    <item>
      <title>${escapeXml(item.objetoCompra.slice(0, 200))}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${item.dataPublicacao ? new Date(item.dataPublicacao).toUTCString() : new Date().toUTCString()}</pubDate>
      <description>${escapeXml(`${desc} — publicado ${formatDateBr(item.dataPublicacao)}`)}</description>
    </item>`;
        })
        .join('');
    }
  } catch {
    itemsXml = '';
  }

  const selfUrl = `${site}/rss?${req.nextUrl.searchParams.toString()}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(titleParts.join(' | '))}</title>
    <link>${escapeXml(site)}</link>
    <description>Alertas de contratações públicas do PNCP filtrados por palavra-chave e UF.</description>
    <language>pt-BR</language>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
