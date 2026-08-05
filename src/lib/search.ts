import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { resolveDatabaseUrl } from './env';
import { reaisToCentavos } from './format';
import { nowSaoPaulo } from './contratacao-filters';
import type { BuscaQuery } from './validators';

export type ContratacaoListItem = {
  id: string;
  numeroControlePNCP: string;
  objetoCompra: string;
  modalidadeNome: string;
  modalidadeId: number;
  situacaoNome: string;
  situacaoId: number;
  valorEstimado: string;
  dataPublicacao: Date | null;
  ufSigla: string | null;
  municipioNome: string | null;
  orgao: { id: string; razaoSocial: string; slug: string; cnpj: string };
  rank?: number;
};

export type BuscaResult = {
  items: ContratacaoListItem[];
  nextCursor: string | null;
  totalApprox: number | null;
};

function encodeCursor(dataPublicacao: Date | null, id: string): string {
  const ts = dataPublicacao ? dataPublicacao.toISOString() : '1970-01-01T00:00:00.000Z';
  return Buffer.from(JSON.stringify({ ts, id }), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): { ts: string; id: string } | null {
  try {
    const raw = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      ts?: string;
      id?: string;
    };
    if (!raw.ts || !raw.id) return null;
    return { ts: raw.ts, id: raw.id };
  } catch {
    return null;
  }
}

/**
 * Busca full-text (portuguese) com ts_rank + filtros.
 * Paginação por cursor (dataPublicacao DESC, id DESC).
 */
export async function searchContratacoes(query: BuscaQuery): Promise<BuscaResult> {
  if (!resolveDatabaseUrl()) {
    throw new Error(
      'Banco de dados não configurado: defina DATABASE_URL no Railway (Variables → vincule o Postgres ao serviço web).',
    );
  }

  const limit = query.limit ?? 20;
  const valorMin = query.valorMin != null ? reaisToCentavos(query.valorMin) : null;
  const valorMax = query.valorMax != null ? reaisToCentavos(query.valorMax) : null;
  const cursor = query.cursor ? decodeCursor(query.cursor) : null;

  const conditions: Prisma.Sql[] = [];

  if (query.q && query.q.length > 0) {
    conditions.push(
      Prisma.sql`"objeto_tsv" @@ plainto_tsquery('portuguese', ${query.q})`,
    );
  }
  if (query.uf) {
    conditions.push(Prisma.sql`"ufSigla" = ${query.uf}`);
  }
  if (query.municipio) {
    conditions.push(Prisma.sql`"municipioNome" ILIKE ${'%' + query.municipio + '%'}`);
  }
  if (query.modalidade != null) {
    conditions.push(Prisma.sql`"modalidadeId" = ${query.modalidade}`);
  }
  if (query.situacao != null) {
    conditions.push(Prisma.sql`"situacaoId" = ${query.situacao}`);
  }
  if (valorMin != null) {
    conditions.push(Prisma.sql`"valorEstimado" >= ${valorMin}`);
  }
  if (valorMax != null) {
    conditions.push(Prisma.sql`"valorEstimado" <= ${valorMax}`);
  }
  if (query.de) {
    conditions.push(Prisma.sql`"dataPublicacao" >= ${new Date(query.de + 'T00:00:00-03:00')}`);
  }
  if (query.ate) {
    conditions.push(Prisma.sql`"dataPublicacao" <= ${new Date(query.ate + 'T23:59:59-03:00')}`);
  }
  if (query.aberto) {
    const now = nowSaoPaulo();
    conditions.push(Prisma.sql`"situacaoId" = 1`);
    conditions.push(Prisma.sql`"dataEncerramentoProposta" >= ${now}`);
  }
  if (cursor) {
    conditions.push(
      Prisma.sql`("dataPublicacao", "id") < (${new Date(cursor.ts)}::timestamptz, ${cursor.id})`,
    );
  }

  const whereSql =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

  const rankSql = query.q
    ? Prisma.sql`ts_rank("objeto_tsv", plainto_tsquery('portuguese', ${query.q})) AS rank`
    : Prisma.sql`0::float AS rank`;

  const orderSql = query.q
    ? Prisma.sql`ORDER BY rank DESC, "dataPublicacao" DESC NULLS LAST, "id" DESC`
    : Prisma.sql`ORDER BY "dataPublicacao" DESC NULLS LAST, "id" DESC`;

  type Row = {
    id: string;
    numeroControlePNCP: string;
    objetoCompra: string;
    modalidadeNome: string;
    modalidadeId: number;
    situacaoNome: string;
    situacaoId: number;
    valorEstimado: bigint;
    dataPublicacao: Date | null;
    ufSigla: string | null;
    municipioNome: string | null;
    orgaoId: string;
    orgaoRazao: string;
    orgaoSlug: string;
    orgaoCnpj: string;
    rank: number;
  };

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      c."id",
      c."numeroControlePNCP",
      c."objetoCompra",
      c."modalidadeNome",
      c."modalidadeId",
      c."situacaoNome",
      c."situacaoId",
      c."valorEstimado",
      c."dataPublicacao",
      c."ufSigla",
      c."municipioNome",
      o."id" AS "orgaoId",
      o."razaoSocial" AS "orgaoRazao",
      o."slug" AS "orgaoSlug",
      o."cnpj" AS "orgaoCnpj",
      ${rankSql}
    FROM "Contratacao" c
    INNER JOIN "Orgao" o ON o."id" = c."orgaoId"
    ${whereSql}
    ${orderSql}
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return {
    items: page.map((r) => ({
      id: r.id,
      numeroControlePNCP: r.numeroControlePNCP,
      objetoCompra: r.objetoCompra,
      modalidadeNome: r.modalidadeNome,
      modalidadeId: r.modalidadeId,
      situacaoNome: r.situacaoNome,
      situacaoId: r.situacaoId,
      valorEstimado: r.valorEstimado.toString(),
      dataPublicacao: r.dataPublicacao,
      ufSigla: r.ufSigla,
      municipioNome: r.municipioNome,
      orgao: {
        id: r.orgaoId,
        razaoSocial: r.orgaoRazao,
        slug: r.orgaoSlug,
        cnpj: r.orgaoCnpj,
      },
      rank: r.rank,
    })),
    nextCursor: hasMore && last ? encodeCursor(last.dataPublicacao, last.id) : null,
    totalApprox: null,
  };
}

export async function countContratacoes(): Promise<number> {
  try {
    return await prisma.contratacao.count();
  } catch {
    return 0;
  }
}
