import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { searchContratacoes } from '@/lib/search';
import { buscaQuerySchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit(`api:contratacoes:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit excedido. Tente novamente em breve.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = buscaQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await searchContratacoes(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Falha na busca',
        detail: err instanceof Error ? err.message : String(err),
        items: [],
        nextCursor: null,
      },
      { status: 503 },
    );
  }
}
