import { NextRequest, NextResponse } from 'next/server';
import { dbErrorMessage } from '@/lib/db-errors';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`api:contratacao:${ip}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 });
  }

  const { id } = await ctx.params;

  try {
    const contratacao = await prisma.contratacao.findFirst({
      where: {
        OR: [{ id }, { numeroControlePNCP: id }],
      },
      include: {
        orgao: true,
        unidade: { include: { municipio: true } },
        itens: { orderBy: { numeroItem: 'asc' } },
      },
    });

    if (!contratacao) {
      return NextResponse.json({ error: 'Contratação não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      ...contratacao,
      valorEstimado: contratacao.valorEstimado.toString(),
      valorHomologado: contratacao.valorHomologado?.toString() ?? null,
      itens: contratacao.itens.map((i) => ({
        ...i,
        valorUnitario: i.valorUnitario?.toString() ?? null,
        valorTotal: i.valorTotal?.toString() ?? null,
        quantidade: i.quantidade?.toString() ?? null,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: dbErrorMessage(err) }, { status: 503 });
  }
}
