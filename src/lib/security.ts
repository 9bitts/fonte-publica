/**
 * Helpers de segurança (URLs, IP do cliente).
 */

/** Aceita só http(s); rejeita javascript:, data:, etc. */
export function safeHttpUrl(href: string | null | undefined): string | null {
  if (!href || typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
}

const PNCP_ALLOWED_HOSTS = new Set(['pncp.gov.br', 'www.pncp.gov.br']);

/**
 * Valida PNCP_BASE_URL: só https + hosts oficiais do PNCP.
 */
export function resolvePncpBaseUrl(): string {
  const raw = (process.env.PNCP_BASE_URL ?? 'https://pncp.gov.br/api/consulta').replace(/\/$/, '');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('PNCP_BASE_URL inválida');
  }
  if (url.protocol !== 'https:') {
    throw new Error('PNCP_BASE_URL deve usar https');
  }
  if (!PNCP_ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`PNCP_BASE_URL host não permitido: ${url.hostname}`);
  }
  return raw;
}
