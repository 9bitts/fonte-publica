import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * /llms.txt — manifesto para agentes e buscas generativas (GEO).
 * Spec: https://llmstxt.org/
 */
export async function GET() {
  const site = getSiteUrl();
  const body = `# Fonte Pública

> Radar gratuito de licitações e contratos públicos brasileiros. Indexa dados abertos do Portal Nacional de Contratações Públicas (PNCP), permite busca por texto e filtros, e oferece alertas via RSS — sem cadastro.

A Fonte Pública não substitui o PNCP: é um índice pesquisável sobre a API pública de consulta do PNCP. Os dados oficiais e a autenticidade jurídica permanecem no governo. Valores monetários são armazenados em centavos; o fuso de referência é America/Sao_Paulo.

## Páginas principais

- [Home](${site}/): Busca rápida e visão geral do produto
- [Busca](${site}/busca): Full-text e filtros (UF, município, modalidade, valor, período, propostas em aberto)
- [Alertas RSS](${site}/alertas): Montar feed por palavra-chave e UF, sem conta
- [RSS](${site}/rss): Endpoint do feed (para leitores; preferir /alertas no navegador)

## Navegação geográfica e por órgão

- [UF — exemplo SP](${site}/uf/SP): Contratações e municípios de um estado
- [Município](${site}/municipio/): Páginas por município (slug IBGE), após ingestão
- [Órgão](${site}/orgao/): Páginas por órgão comprador

## Fontes oficiais

- [PNCP — Portal Nacional de Contratações Públicas](https://pncp.gov.br): Fonte dos dados
- [API de consulta PNCP](https://pncp.gov.br/api/consulta): Endpoint usado na ingestão
- [Dados abertos PNCP](https://www.gov.br/pncp/pt-br/acesso-a-informacao/dados-abertos): Licença / política de dados

## Técnico

- [Sitemap](${site}/sitemap.xml): URLs para indexação
- [robots.txt](${site}/robots.txt): Regras de crawling (APIs JSON em /api/ não são para indexação humana)

## Optional

- [GitHub — código-fonte](https://github.com/9bitts/fonte-publica): Repositório do projeto
- [9bitts](https://9bitts.dev/): Organização mantenedora
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
