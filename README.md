# Fonte Pública

Radar de licitações e contratos públicos brasileiros. Ingere dados do [PNCP](https://pncp.gov.br) (Portal Nacional de Contratações Públicas), normaliza, indexa em PostgreSQL e expõe busca full-text, filtros, alertas RSS e páginas por órgão / UF / município.

## Stack

- Next.js 15 (App Router) + TypeScript strict + Tailwind CSS 4
- Prisma + PostgreSQL 16 (Docker Compose)
- Zod, Vitest, ESLint, Prettier
- Sem serviços pagos e sem LLM em runtime

## Setup local

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev --name init
npx prisma db execute --file prisma/sql/fulltext.sql --schema prisma/schema.prisma
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Ingestão

Consulte `docs/api-notes.md` (endpoints reais do PNCP, timeouts observados, campos mapeados).

```bash
# últimos 7 dias (default se omitir --desde), todas as modalidades
npm run ingest -- --desde=2026-08-01 --limite=100

# filtrar UF
npm run ingest -- --desde=2026-08-01 --ate=2026-08-03 --uf=SP

# uma modalidade (6 = Pregão Eletrônico)
npm run ingest -- --desde=2026-08-01 --modalidade=6
```

Flags: `--desde`, `--ate`, `--dias`, `--uf`, `--limite`, `--modalidade`.

O script:

1. pagina a API `GET /api/consulta/v1/contratacoes/publicacao`
2. faz retry com backoff em 429/5xx/timeout
3. rate-limit ~350 ms entre requests
4. upsert idempotente por `numeroControlePNCP`
5. grava checkpoint em `IngestRun`

Rodar duas vezes com os mesmos parâmetros **não duplica** registros.

### Ingestão automática no Railway (Cron)

O site **não** puxa o PNCP sozinho: um serviço Cron diário roda `npm run ingest:cron` (últimos 2 dias, todas as modalidades) e encerra.

1. No projeto Railway: **New** → mesmo repositório GitHub
2. **Settings → Config-as-code** → arquivo `railway.ingest.toml`
3. **Variables**: `DATABASE_URL` = referência ao Postgres (igual ao serviço web); `PNCP_BASE_URL=https://pncp.gov.br/api/consulta`
4. Confirme **Cron Schedule** `0 11 * * *` (08:00 America/Sao_Paulo) e **Restart Policy** = Never

Opcional: `INGEST_DIAS`, `INGEST_UF`, `INGEST_LIMITE` nas variáveis do serviço Cron.

**Importante:** o processo precisa sair ao terminar (já faz `prisma.$disconnect` + `process.exit`). Se um deploy ficar “Active”, a próxima execução do cron é pulada.

## Arquitetura

```
PNCP (API consulta)
    │
    ▼
scripts/ingest.ts  ──►  Prisma upsert  ──►  PostgreSQL
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            GET /api/contratacoes      páginas SEO (/uf,/orgao…)     /rss?q=&uf=
            (ts_rank + filtros)         generateMetadata + JSON-LD
```

- Valores monetários em **centavos** (`bigint`)
- Timezone explícito: `America/Sao_Paulo`
- Full-text: coluna gerada `objeto_tsv` + índice GIN (`portuguese`)

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Next.js (Turbopack) |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run ingest` | Ingestão PNCP |
| `npm run ingest:cron` | Ingestão dos últimos 2 dias (Cron Railway) |
| `npm run format` | Prettier |

## Limitações conhecidas

Ver `docs/PENDENCIAS.md` e `docs/api-notes.md`. Em resumo: a API do PNCP exige modalidade por chamada, timeouts/504 são frequentes, e itens da contratação são best-effort.

## Licença de dados

Os dados pertencem ao PNCP / administração pública. Este projeto apenas indexa a API pública de consulta.
