# Notas da API de Consulta do PNCP

Fonte oficial consultada antes da implementação:

- Swagger: https://pncp.gov.br/api/consulta/swagger-ui/index.html
- Base URL: `https://pncp.gov.br/api/consulta`
- Manual: *Manual PNCP API Consultas – Versão 1.0* (gov.br)

## Endpoints usados

### `GET /v1/contratacoes/publicacao`

Contratações por data de publicação.

Parâmetros obrigatórios (manual §6.3):

| Campo | Formato | Obrigatório |
| --- | --- | --- |
| `dataInicial` | AAAAMMDD | sim |
| `dataFinal` | AAAAMMDD | sim |
| `codigoModalidadeContratacao` | int (1–13) | sim |
| `pagina` | int | sim |

Opcionais: `uf`, `codigoMunicipioIbge`, `cnpj`, `codigoUnidadeAdministrativa`, `idUsuario`, `codigoModoDisputa`, `tamanhoPagina` (máx. 500; default 50).

Campos de retorno relevantes mapeados no client:

- `numeroControlePNCP`, `numeroCompra`, `anoCompra`, `processo`, `sequencialCompra`
- `modalidadeId`, `modalidadeNome`, `modoDisputaId`, `modoDisputaNome`
- `situacaoCompraId`, `situacaoCompraNome`, `objetoCompra`, `informacaoComplementar`, `srp`
- `valorTotalEstimado`, `valorTotalHomologado`
- `dataAberturaProposta`, `dataEncerramentoProposta`, `dataPublicacaoPncp`, `dataInclusao`, `dataAtualizacao`
- `orgaoEntidade.{cnpj,razaosocial|razaoSocial,poderId,esferaId}`
- `unidadeOrgao.{codigoUnidade,nomeUnidade,codigoIbge,municipioNome,ufSigla,ufNome}`
- `linkSistemaOrigem`, `usuarioNome`

Envelope de paginação: `data`, `totalRegistros`, `totalPaginas`, `numeroPagina`, `paginasRestantes`, `empty`.

### `GET /v1/contratacoes/atualizacao`

Listado no Swagger (contratações por data de atualização). Mesma forma geral de parâmetros. Usado como fallback opcional; a ingestão padrão usa `publicacao`.

## Endpoints / comportamentos problemáticos

| Tentativa | Resultado | Ação |
| --- | --- | --- |
| `GET .../publicacao` (2026-03-01..02, modalidade 6) | HTTP **504** Gateway Time-out (~72s) | Registrado; client faz retry com backoff exponencial (máx. 5) |
| `GET .../publicacao` (2026-08-01, modalidade 8) | **timeout** de cliente (60s) | Idem; reduzir janela de datas e `tamanhoPagina` mitiga |
| `GET .../atualizacao` | timeout intermitente | Documentado; não bloqueia o produto |
| `GET /api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens` | pode exigir auth ou retornar erro | Itens são best-effort; falha não aborta ingestão de contratações |
| OpenAPI `GET /api/consulta/v3/api-docs` | HTTP **500** no momento da implementação | Schema inferido do manual + amostragens quando disponíveis |

## Limitações operacionais

1. A API **exige** `codigoModalidadeContratacao` — não há endpoint público de “todas as modalidades” em uma chamada. A ingestão itera as 13 modalidades.
2. Rate limit não documentado formalmente; usamos ~350 ms entre requests e retries em 429/5xx.
3. Timeouts e 504 são frequentes em horários de pico; o checkpoint em `IngestRun` permite retomar.
4. Valores monetários na API vêm em reais (decimal); persistimos em **centavos** (`bigint`).
5. Datas de proposta estão em horário de Brasília (manual); parseamos e exibimos com timezone `America/Sao_Paulo`.
