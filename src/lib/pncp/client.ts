import { MODALIDADES, SITUACOES } from '../constants';
import { logger } from '../logger';
import { resolvePncpBaseUrl } from '../security';
import { pncpContratacaoSchema, pncpPageSchema, type PncpContratacao } from '../validators';

export type PncpFetchOptions = {
  dataInicial: string;
  dataFinal: string;
  codigoModalidadeContratacao: number;
  uf?: string;
  pagina: number;
  tamanhoPagina?: number;
  endpoint?: 'publicacao' | 'atualizacao';
};

export type PncpPageResult = {
  items: PncpContratacao[];
  totalRegistros: number;
  totalPaginas: number;
  numeroPagina: number;
  paginasRestantes: number;
  empty: boolean;
};

const RATE_LIMIT_MS = Number(process.env.PNCP_RATE_LIMIT_MS ?? 350);
const MAX_RETRIES = Number(process.env.PNCP_MAX_RETRIES ?? 5);

function baseUrl(): string {
  return resolvePncpBaseUrl();
}

let lastRequestAt = 0;

async function throttle() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < RATE_LIMIT_MS) {
    await sleep(RATE_LIMIT_MS - elapsed);
  }
  lastRequestAt = Date.now();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(opts: PncpFetchOptions): string {
  const endpoint = opts.endpoint ?? 'publicacao';
  const params = new URLSearchParams({
    dataInicial: opts.dataInicial,
    dataFinal: opts.dataFinal,
    codigoModalidadeContratacao: String(opts.codigoModalidadeContratacao),
    pagina: String(opts.pagina),
    tamanhoPagina: String(opts.tamanhoPagina ?? 50),
  });
  if (opts.uf) params.set('uf', opts.uf.toUpperCase());
  return `${baseUrl()}/v1/contratacoes/${endpoint}?${params.toString()}`;
}

/**
 * Cliente HTTP da API de Consulta do PNCP.
 * Doc: https://pncp.gov.br/api/consulta/swagger-ui/index.html
 * Manual: Manual PNCP API Consultas v1.0
 *
 * Endpoint principal: GET /v1/contratacoes/publicacao
 * Obrigatórios: dataInicial, dataFinal (AAAAMMDD), codigoModalidadeContratacao, pagina
 */
export async function fetchContratacoesPage(opts: PncpFetchOptions): Promise<PncpPageResult> {
  const url = buildUrl(opts);
  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_RETRIES) {
    attempt += 1;
    await throttle();

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(90_000),
      });

      if (res.status === 204) {
        return {
          items: [],
          totalRegistros: 0,
          totalPaginas: 0,
          numeroPagina: opts.pagina,
          paginasRestantes: 0,
          empty: true,
        };
      }

      if (res.status === 429 || res.status >= 500) {
        const backoff = Math.min(30_000, 500 * 2 ** attempt);
        logger.warn('pncp_retry', { status: res.status, attempt, backoff, url });
        await sleep(backoff);
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`PNCP HTTP ${res.status}: ${body.slice(0, 300)}`);
      }

      const json: unknown = await res.json();
      const page = pncpPageSchema.parse(json);
      const items: PncpContratacao[] = [];

      for (const raw of page.data) {
        const parsed = pncpContratacaoSchema.safeParse(raw);
        if (parsed.success) {
          const item = parsed.data;
          if (!item.modalidadeNome) {
            item.modalidadeNome = MODALIDADES[item.modalidadeId] ?? `Modalidade ${item.modalidadeId}`;
          }
          if (!item.situacaoCompraNome) {
            item.situacaoCompraNome =
              SITUACOES[item.situacaoCompraId] ?? `Situação ${item.situacaoCompraId}`;
          }
          items.push(item);
        } else {
          logger.warn('pncp_item_parse_failed', {
            issues: parsed.error.issues.slice(0, 3),
          });
        }
      }

      return {
        items,
        totalRegistros: page.totalRegistros ?? items.length,
        totalPaginas: page.totalPaginas ?? 1,
        numeroPagina: page.numeroPagina ?? opts.pagina,
        paginasRestantes: page.paginasRestantes ?? 0,
        empty: page.empty ?? items.length === 0,
      };
    } catch (err) {
      lastError = err;
      const backoff = Math.min(30_000, 500 * 2 ** attempt);
      logger.warn('pncp_fetch_error', {
        attempt,
        backoff,
        error: err instanceof Error ? err.message : String(err),
        url,
      });
      await sleep(backoff);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Falha ao consultar PNCP após ${MAX_RETRIES} tentativas`);
}

export async function fetchItensContratacao(
  cnpj: string,
  ano: number,
  sequencial: number,
): Promise<unknown[]> {
  // Mesmo host allowlisted; path de publicação autenticada (best-effort).
  const url = `${baseUrl().replace('/api/consulta', '/api/pncp')}/v1/orgaos/${encodeURIComponent(cnpj)}/compras/${ano}/${sequencial}/itens`;
  await throttle();
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      logger.warn('pncp_itens_unavailable', { status: res.status, url });
      return [];
    }
    const json: unknown = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (err) {
    logger.warn('pncp_itens_error', {
      error: err instanceof Error ? err.message : String(err),
      url,
    });
    return [];
  }
}
