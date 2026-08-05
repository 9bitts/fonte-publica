# Pendências e limitações honestas

Atualizado na entrega inicial do produto.

## Ingestão / PNCP

- [ ] **Estabilidade da API de consulta**: durante a implementação, `GET /v1/contratacoes/publicacao` e `atualizacao` retornaram **504** e **timeouts** frequentes (ver `docs/api-notes.md`). O client faz retry/backoff, mas uma carga histórica completa pode exigir várias execuções e janelas curtas de data.
- [ ] **Retomada fina do checkpoint**: `IngestRun` grava modalidade + página, mas o script ainda reinicia do início dos parâmetros CLI (não há `--resume <runId>`).
- [ ] **Itens da contratação**: a listagem de publicação não traz itens. Tentamos o endpoint `/api/pncp/.../itens` de forma best-effort; autenticação/indisponibilidade são engolidas e a UI mostra estado vazio honesto.
- [ ] **Órgãos sub-rogados**: campos `orgaoSubRogado` / `unidadeSubRogada` do manual não são persistidos.
- [ ] **Amparo legal**: não há tabela própria; o JSON de amparo não é armazenado além do que cabe em informação complementar futura.
- [ ] **Seed de UFs**: UFs só entram no banco quando aparecem em uma contratação ingerida (a página `/uf/[sigla]` usa o mapa estático `UFS` mesmo sem linhas em `Uf`).

## Busca / API

- [ ] **`totalApprox`**: a busca por cursor não devolve total exato (evitar `COUNT(*)` caro em full-text). A UI mostra o tamanho da página.
- [ ] **Rate limit em memória**: adequado a single-instance; em multi-instância cada processo tem seu bucket.
- [ ] **Coluna `objeto_tsv`**: criada via SQL separado (`prisma/sql/fulltext.sql`); precisa rodar após migrate. Se ausente, a busca full-text falha com erro SQL (a UI mostra estado de erro).
- [ ] **Preview `fullTextSearchPostgres`**: declarado no schema Prisma, mas a busca usa `$queryRaw` diretamente (mais controle sobre `ts_rank` / `plainto_tsquery`).

## Interface / SEO

- [ ] **OG image estática `/og.png`**: entregamos `public/og.svg` + `opengraph-image.tsx` (gerada pelo Next). Alguns crawlers preferem PNG absoluto — converter/exportar PNG dedicado se necessário em produção.
- [ ] **Sitemap paginado**: `generateSitemaps` pagina contratações; órgãos/municípios só entram na página `id=0` (cap 5000). Acima disso, faltam URLs.
- [ ] **Loading.tsx global**: genérico; rotas específicas não têm skeletons diferenciados.
- [ ] **Dark/light**: via `prefers-color-scheme` apenas — sem toggle manual.

## Qualidade / ops

- [ ] **Testes de upsert contra Postgres**: a suite Vitest cobre chaves naturais/normalização sem DB. Não há teste de integração E2E da ingestão (dependeria de PNCP online).
- [ ] **Observabilidade**: logs JSON no stdout da ingestão; sem métricas/Prometheus.
- [ ] **Autenticação / contas**: propositalmente fora de escopo (alertas só via RSS).
- [x] **Deploy**: Dockerfile + `railway.toml` (web) e `railway.ingest.toml` (Cron diário). Ainda falta criar o segundo serviço no dashboard Railway se ainda não existir.
- [ ] **Cron em produção**: conferir no Railway se o serviço de ingestão está com schedule `0 11 * * *`, `restartPolicyType=NEVER` e `DATABASE_URL` vinculada.

## Dados em produção

Regra cumprida: **sem mocks na UI**. Se o banco estiver vazio ou a ingestão falhar, home/busca/detalhe mostram contagem zero ou empty/error states explícitos.
