#!/usr/bin/env tsx
/**
 * Ingestão PNCP → Postgres
 *
 * Uso:
 *   npx tsx scripts/ingest.ts --desde=2026-08-01 [--uf=SP] [--limite=100]
 *   npx tsx scripts/ingest.ts --dias=2
 *   npm run ingest:cron   # pensado para Railway Cron (env INGEST_*)
 *
 * Flags:
 *   --desde=YYYY-MM-DD   data inicial (se omitida: hoje − --dias ou 7)
 *   --ate=YYYY-MM-DD     data final (default: hoje America/Sao_Paulo)
 *   --dias=N             janela relativa (default 7 se sem --desde; cron usa 2)
 *   --uf=XX              filtra UF
 *   --limite=N           para após N registros processados
 *   --modalidade=N       só uma modalidade (default: todas de MODALIDADES_INGESTAO)
 *
 * Env (úteis no Cron Railway; flags CLI têm prioridade):
 *   INGEST_DIAS, INGEST_DESDE, INGEST_ATE, INGEST_UF, INGEST_LIMITE, INGEST_MODALIDADE
 */
import { subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { MODALIDADES_INGESTAO } from '../src/lib/constants';
import { prisma } from '../src/lib/db';
import { TIMEZONE, toAaaammdd } from '../src/lib/format';
import { logger } from '../src/lib/logger';
import { fetchContratacoesPage } from '../src/lib/pncp/client';
import { upsertContratacao } from '../src/lib/pncp/upsert';

function parseArgs(argv: string[]) {
  const flags: Record<string, string | boolean> = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [k, v] = arg.slice(2).split('=');
    flags[k!] = v === undefined ? true : v;
  }
  return flags;
}

function flagOrEnv(
  flags: Record<string, string | boolean>,
  flag: string,
  envName: string,
): string | undefined {
  const f = flags[flag];
  if (typeof f === 'string' && f.length > 0) return f;
  const e = process.env[envName];
  return e && e.length > 0 ? e : undefined;
}

function parseDateFlag(value: string | undefined, fallback: Date): Date {
  if (!value || typeof value !== 'string') return fallback;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) throw new Error(`Data inválida: ${value}. Use YYYY-MM-DD.`);
  return new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00-03:00`);
}

async function ensureFullText() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Contratacao"
      ADD COLUMN IF NOT EXISTS "objeto_tsv" tsvector
      GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce("objetoCompra", ''))) STORED;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Contratacao_objeto_tsv_idx"
      ON "Contratacao" USING GIN ("objeto_tsv");
  `);
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const nowSp = toZonedTime(new Date(), TIMEZONE);

  const diasRaw = flagOrEnv(flags, 'dias', 'INGEST_DIAS');
  const dias = diasRaw != null ? Number(diasRaw) : undefined;
  if (dias != null && (!Number.isFinite(dias) || dias < 0 || dias > 365)) {
    throw new Error(`--dias / INGEST_DIAS inválido: ${diasRaw}`);
  }

  const desdeStr = flagOrEnv(flags, 'desde', 'INGEST_DESDE');
  const ateStr = flagOrEnv(flags, 'ate', 'INGEST_ATE');
  const desde = parseDateFlag(desdeStr, subDays(nowSp, dias ?? 7));
  const ate = parseDateFlag(ateStr, nowSp);
  const uf = flagOrEnv(flags, 'uf', 'INGEST_UF')?.toUpperCase();
  const limiteRaw = flagOrEnv(flags, 'limite', 'INGEST_LIMITE');
  const limite = limiteRaw != null ? Number(limiteRaw) : undefined;
  const modalidadeRaw = flagOrEnv(flags, 'modalidade', 'INGEST_MODALIDADE');
  const modalidadeFiltro = modalidadeRaw != null ? Number(modalidadeRaw) : undefined;

  const dataInicial = toAaaammdd(desde);
  const dataFinal = toAaaammdd(ate);
  const modalidades = modalidadeFiltro
    ? [modalidadeFiltro]
    : [...MODALIDADES_INGESTAO];

  logger.info('ingest_start', {
    dataInicial,
    dataFinal,
    uf,
    limite,
    dias: dias ?? (desdeStr ? null : 7),
    modalidades,
  });

  await ensureFullText();

  const run = await prisma.ingestRun.create({
    data: {
      status: 'running',
      desde: dataInicial,
      ate: dataFinal,
      uf: uf ?? null,
      checkpoint: { modalidades, modalidadeIdx: 0, pagina: 1 },
    },
  });

  let processados = 0;
  let upserted = 0;
  let erros = 0;

  try {
    for (let mi = 0; mi < modalidades.length; mi++) {
      const modalidadeId = modalidades[mi]!;
      let pagina = 1;
      let totalPaginas = 1;

      while (pagina <= totalPaginas) {
        if (limite != null && processados >= limite) {
          logger.info('ingest_limite_atingido', { processados, limite });
          break;
        }

        const page = await fetchContratacoesPage({
          dataInicial,
          dataFinal,
          codigoModalidadeContratacao: modalidadeId,
          uf,
          pagina,
          tamanhoPagina: 50,
          endpoint: 'publicacao',
        });

        totalPaginas = Math.max(page.totalPaginas || 1, 1);

        for (const item of page.items) {
          if (limite != null && processados >= limite) break;
          try {
            const result = await upsertContratacao(item);
            processados += 1;
            if (result.created) upserted += 1;
            else upserted += 1; // update também conta como upsert
          } catch (err) {
            erros += 1;
            logger.error('ingest_item_error', {
              numeroControlePNCP: item.numeroControlePNCP,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }

        await prisma.ingestRun.update({
          where: { id: run.id },
          data: {
            paginaAtual: pagina,
            totalPaginas,
            totalRegistros: page.totalRegistros,
            processados,
            upserted,
            erros,
            modalidadeId,
            checkpoint: { modalidades, modalidadeIdx: mi, pagina, modalidadeId },
          },
        });

        logger.info('ingest_page', {
          modalidadeId,
          pagina,
          totalPaginas,
          items: page.items.length,
          processados,
          erros,
        });

        if (page.empty || page.items.length === 0) break;
        pagina += 1;
      }

      if (limite != null && processados >= limite) break;
    }

    await prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        processados,
        upserted,
        erros,
        finishedAt: new Date(),
        mensagem: 'ok',
      },
    });

    logger.info('ingest_done', { runId: run.id, processados, upserted, erros });
  } catch (err) {
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        processados,
        upserted,
        erros,
        finishedAt: new Date(),
        mensagem: err instanceof Error ? err.message : String(err),
      },
    });
    logger.error('ingest_failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    // Garante saída limpa para o Cron Railway (sem handles abertos).
    process.exit(process.exitCode ?? 0);
  });
