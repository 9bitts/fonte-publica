import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const TIMEZONE = 'America/Sao_Paulo';

/** Converte valor monetário decimal (reais) para centavos (bigint). */
export function reaisToCentavos(value: number | string | null | undefined): bigint {
  if (value === null || value === undefined || value === '') return 0n;
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (!Number.isFinite(n)) return 0n;
  return BigInt(Math.round(n * 100));
}

/** Formata centavos para BRL. */
export function formatCentavos(centavos: bigint | number | null | undefined): string {
  const n = typeof centavos === 'bigint' ? Number(centavos) : (centavos ?? 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n / 100);
}

/** Parse de data ISO ou AAAAMMDD para Date em America/Sao_Paulo. */
export function parsePncpDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{8}$/.test(trimmed)) {
    const y = trimmed.slice(0, 4);
    const m = trimmed.slice(4, 6);
    const d = trimmed.slice(6, 8);
    return toZonedTime(new Date(`${y}-${m}-${d}T12:00:00`), TIMEZONE);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function formatDateBr(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return formatInTimeZone(d, TIMEZONE, 'dd/MM/yyyy');
}

export function formatDateTimeBr(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return formatInTimeZone(d, TIMEZONE, "dd/MM/yyyy HH:mm 'BRT'");
}

export function toAaaammdd(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'yyyyMMdd');
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}
