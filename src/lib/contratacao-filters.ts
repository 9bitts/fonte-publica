import type { Prisma } from '@prisma/client';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from './format';

/** Agora em America/Sao_Paulo (para comparar com datas de proposta do PNCP). */
export function nowSaoPaulo(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/**
 * Contratação com recebimento de propostas ainda aberto:
 * situação "Divulgada no PNCP" (1) e dataEncerramentoProposta >= agora.
 */
export function abertoWhere(now = nowSaoPaulo()): Prisma.ContratacaoWhereInput {
  return {
    situacaoId: 1,
    dataEncerramentoProposta: { gte: now },
  };
}

export function publicacaoPeriodoWhere(
  de?: string,
  ate?: string,
): Prisma.ContratacaoWhereInput {
  const dataPublicacao: Prisma.DateTimeNullableFilter = {};
  if (de) dataPublicacao.gte = new Date(`${de}T00:00:00-03:00`);
  if (ate) dataPublicacao.lte = new Date(`${ate}T23:59:59-03:00`);
  if (!de && !ate) return {};
  return { dataPublicacao };
}

export type LocalListFilters = {
  de?: string;
  ate?: string;
  /** true = só propostas em aberto */
  aberto?: boolean;
};

export function buildContratacaoWhere(
  base: Prisma.ContratacaoWhereInput,
  filters: LocalListFilters,
): Prisma.ContratacaoWhereInput {
  const parts: Prisma.ContratacaoWhereInput[] = [base];
  const periodo = publicacaoPeriodoWhere(filters.de, filters.ate);
  if (Object.keys(periodo).length > 0) parts.push(periodo);
  if (filters.aberto) parts.push(abertoWhere());
  return parts.length === 1 ? parts[0]! : { AND: parts };
}

export function pickLocalFilters(
  sp: Record<string, string | string[] | undefined>,
): LocalListFilters {
  const str = (k: string) => {
    const v = sp[k];
    return typeof v === 'string' ? v : undefined;
  };
  const de = str('de');
  const ate = str('ate');
  const abertoRaw = str('aberto');
  // Default: mostrar só em aberto quando o param não veio (primeira visita).
  // ?aberto=0 desliga o filtro.
  const aberto =
    abertoRaw === undefined || abertoRaw === ''
      ? true
      : abertoRaw === '1' || abertoRaw === 'true' || abertoRaw === 'on';

  return {
    de: de && /^\d{4}-\d{2}-\d{2}$/.test(de) ? de : undefined,
    ate: ate && /^\d{4}-\d{2}-\d{2}$/.test(ate) ? ate : undefined,
    aberto,
  };
}
