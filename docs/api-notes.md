# Notas da API PNCP — Fonte Pública

Fontes oficiais usadas na implementação:

| Documento | URL |
| --- | --- |
| Manual de Integração PNCP v. 2.5 | https://pncp.gov.br/manual/pt-br/latest/index.html |
| Cópia local (PDF) | `docs/manual-integracao-pncp-v2.5.pdf` |
| Swagger API de **Consulta** (leitura pública) | https://pncp.gov.br/api/consulta/swagger-ui/index.html |
| Swagger API de **Integração** (manutenção) | https://pncp.gov.br/api/pncp/swagger-ui/index.html |

## O que o manual diz (v2.5 §5.4)

> O acesso ao Portal de consultas é **público**. Já as APIs de manutenção (inserção, retificação ou exclusão) requerem autenticação/autorização (JWT via `POST /api/pncp/v1/usuarios/login`), após credenciamento no MGI.

**Fonte Pública só consome a API de consulta.** Não publica dados no PNCP; portanto:

- **não** usa login/senha/JWT
- **não** usa `https://pncp.gov.br/api/pncp` como base da ingestão
- usa `https://pncp.gov.br/api/consulta` (variável `PNCP_BASE_URL`)

## Ambientes (Manual §5)

| Ambiente | Integração (`/api/pncp`) | Consulta (`/api/consulta`) |
| --- | --- | --- |
| Homologação | `https://treina.pncp.gov.br/api/pncp` | `https://treina.pncp.gov.br/api/consulta` |
| Produção | `https://pncp.gov.br/api/pncp` | `https://pncp.gov.br/api/consulta` |

## Configuração no Railway / `.env`

```env
PNCP_BASE_URL=https://pncp.gov.br/api/consulta
PNCP_RATE_LIMIT_MS=350
PNCP_MAX_RETRIES=8
```

Não adicione `PNCP_LOGIN` / `PNCP_SENHA` neste produto — credenciais de integração são para plataformas que **enviam** contratações ao PNCP.

Em **504**, o client usa backoff mais longo (até ~90s) e até `PNCP_MAX_RETRIES` tentativas. Se a modalidade ainda falhar, o cron **pula** para a próxima (status `partial`) em vez de derrubar a run inteira.

## Endpoint de ingestão

### `GET /v1/contratacoes/publicacao`

Base: `${PNCP_BASE_URL}` → `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao`

Parâmetros obrigatórios (Manual de Consultas / Swagger consulta):

| Campo | Formato | Obrigatório |
| --- | --- | --- |
| `dataInicial` | AAAAMMDD | sim |
| `dataFinal` | AAAAMMDD | sim |
| `codigoModalidadeContratacao` | int (1–13) | sim |
| `pagina` | int | sim |

Opcionais: `uf`, `codigoMunicipioIbge`, `cnpj`, `codigoUnidadeAdministrativa`, `idUsuario`, `codigoModoDisputa`, `tamanhoPagina` (máx. 500; default 50).

Campos de retorno mapeados no client: ver `src/lib/validators.ts` (`pncpContratacaoSchema`).

Envelope: `data`, `totalRegistros`, `totalPaginas`, `numeroPagina`, `paginasRestantes`, `empty`.

### `GET /v1/contratacoes/atualizacao`

Mesma família; ingestão padrão usa `publicacao`.

## Domínios (Manual §7) usados no produto

Modalidades (códigos 1–13) e situações da contratação (1–4) estão em `src/lib/constants.ts`, alinhados ao manual.

## Endpoints / comportamentos problemáticos

| Tentativa | Resultado | Ação |
| --- | --- | --- |
| `GET .../publicacao` | HTTP **504** / timeout frequentes | Retry com backoff longo (máx. 8); skip da modalidade; janelas curtas de data |
| `GET /api/pncp/.../itens` | pode exigir auth ou falhar | Best-effort; UI mostra vazio se indisponível |
| OpenAPI `GET /api/consulta/v3/api-docs` | HTTP **500** intermitente | Schema via manual + Swagger UI |

## Limitações operacionais

1. A API de publicação **exige** `codigoModalidadeContratacao` — a ingestão itera as 13 modalidades.
2. Rate limit não documentado formalmente; usamos ~350 ms entre requests.
3. Valores monetários na API vêm em reais; persistimos em **centavos** (`bigint`).
4. Datas de proposta: horário de Brasília; exibimos com `America/Sao_Paulo`.
5. Protocolo: REST/JSON (Manual §4). Charset de headers ISO-8859-1; payloads UTF-8.
