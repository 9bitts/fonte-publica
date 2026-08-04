#!/usr/bin/env tsx
/**
 * Ingestão PNCP → Postgres
 *
 * Uso:
 *   npx tsx scripts/ingest.ts --desde=2026-08-01 [--uf=SP] [--limite=100]
 *
 * Flags:
 *   --desde=YYYY-MM-DD   data inicial (obrigatória)
 *   --ate=YYYY-MM-DD     data final (default: hoje America/Sao_Paulo)
 *   --uf=XX              filtra UF
 *   --limite=N           para após N registros processados
 *   --modalidade=N       só uma modalidade (default: todas de MODALIDADES_INGESTAO)
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
    flags[k] = v === undefined ? true : v;
  }
  return flags;
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
  const desde = parseDateFlag(
    typeof flags.desde === 'string' ? flags.desde : undefined,
    subDays(nowSp, 7),
  );
  const ate = parseDateFlag(typeof flags.ate === 'string' ? flags.ate : undefined, nowSp);
  const uf = typeof flags.uf === 'string' ? flags.uf.toUpperCase() : undefined;
  const limite = typeof flags.limite === 'string' ? Number(flags.limite) : undefined;
  const modalidadeFiltro =
    typeof flags.modalidade === 'string' ? Number(flags.modalidade) : undefined;

  const dataInicial = toAaaammdd(desde);
  const dataFinal = toAaaammdd(ate);
  const modalidades = modalidadeFiltro
    ? [modalidadeFiltro]
    : [...MODALIDADES_INGESTAO];

  logger.info('ingest_start', { dataInicial, dataFinal, uf, limite, modalidades });

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

main();
