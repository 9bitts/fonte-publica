/**
 * Helpers testáveis do query builder (sem Prisma).
 * A busca real vive em search.ts e usa SQL parametrizado.
 */

export function encodeCursorForTest(dataPublicacao: Date | null, id: string): string {
  const ts = dataPublicacao ? dataPublicacao.toISOString() : '1970-01-01T00:00:00.000Z';
  return Buffer.from(JSON.stringify({ ts, id }), 'utf8').toString('base64url');
}

export function buildWhereClausesForTest(input: {
  q?: string;
  uf?: string;
  municipio?: string;
  modalidade?: number;
  situacao?: number;
  valorMin?: bigint;
  valorMax?: bigint;
  de?: string;
  ate?: string;
}): string[] {
  const clauses: string[] = [];
  if (input.q) clauses.push('fts');
  if (input.uf) clauses.push(`uf=${input.uf}`);
  if (input.municipio) clauses.push('municipio');
  if (input.modalidade != null) clauses.push(`modalidade=${input.modalidade}`);
  if (input.situacao != null) clauses.push(`situacao=${input.situacao}`);
  if (input.valorMin != null) clauses.push('valorMin');
  if (input.valorMax != null) clauses.push('valorMax');
  if (input.de) clauses.push('de');
  if (input.ate) clauses.push('ate');
  return clauses;
}
