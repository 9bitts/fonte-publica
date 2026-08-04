import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit(`api:orgao:${ip}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 });
  }

  const { id } = await ctx.params;

  try {
    const orgao = await prisma.orgao.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { cnpj: id }],
      },
      include: {
        _count: { select: { contratacoes: true, unidades: true } },
        unidades: {
          take: 50,
          include: { municipio: true },
          orderBy: { nomeUnidade: 'asc' },
        },
      },
    });

    if (!orgao) {
      return NextResponse.json({ error: 'Órgão não encontrado' }, { status: 404 });
    }

    const recentes = await prisma.contratacao.findMany({
      where: { orgaoId: orgao.id },
      orderBy: { dataPublicacao: 'desc' },
      take: 20,
      select: {
        id: true,
        numeroControlePNCP: true,
        objetoCompra: true,
        modalidadeNome: true,
        valorEstimado: true,
        dataPublicacao: true,
        situacaoNome: true,
        ufSigla: true,
      },
    });

    return NextResponse.json({
      ...orgao,
      recentes: recentes.map((c) => ({
        ...c,
        valorEstimado: c.valorEstimado.toString(),
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Falha ao carregar órgão', detail: String(err) },
      { status: 503 },
    );
  }
}
