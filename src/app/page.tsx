import Link from 'next/link';
import type { Metadata } from 'next';
import { RssReadersGrid } from '@/components/rss-readers';
import { SearchBox } from '@/components/search-box';
import { PageShell } from '@/components/ui';
import { UFS } from '@/lib/constants';
import { countContratacoes } from '@/lib/search';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fonte Pública — radar de licitações e contratos do PNCP',
  description:
    'Busque licitações e contratos públicos brasileiros do PNCP por palavra-chave, UF e órgão. Grátis, sem cadastro.',
  alternates: { canonical: '/' },
};

const EXEMPLOS = [
  { q: 'software', label: 'software' },
  { q: 'merenda escolar', label: 'merenda escolar' },
  { q: 'pavimentação', label: 'pavimentação' },
  { q: 'medicamentos', label: 'medicamentos' },
];

const UFS_DESTAQUE = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'PE', 'DF'] as const;

export default async function HomePage() {
  const total = await countContratacoes();
  const site = getSiteUrl();
  const hasData = total > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Fonte Pública — contratações PNCP',
    description:
      'Índice pesquisável de contratações públicas brasileiras provenientes do Portal Nacional de Contratações Públicas.',
    url: site,
    creator: { '@type': 'Organization', name: 'Fonte Pública' },
    temporalCoverage: '2021/',
    spatialCoverage: { '@type': 'Place', name: 'Brasil' },
    license: 'https://www.gov.br/pncp/pt-br/acesso-a-informacao/dados-abertos',
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-border pb-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 10% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 55%), linear-gradient(180deg, var(--bg-muted), transparent)',
          }}
        />
        <div className="relative max-w-2xl">
          <p className="font-display text-4xl font-semibold tracking-tight text-text md:text-5xl">
            Fonte Pública
          </p>
          <h1 className="mt-3 text-xl font-medium leading-snug text-text md:text-2xl">
            Encontre licitações e contratos públicos
          </h1>
          <p className="mt-3 text-base text-text-muted">
            Busque no PNCP por palavra-chave, estado ou órgão — grátis e sem criar conta.
          </p>
          <div className="mt-6">
            <SearchBox large />
          </div>
          {hasData ? (
            <p className="mt-3 text-sm text-text-muted">
              {total.toLocaleString('pt-BR')} contratações disponíveis para busca
            </p>
          ) : (
            <p
              className="mt-3 rounded-sm border border-border bg-bg-elevated px-3 py-2 text-sm text-text-muted"
              role="status"
            >
              Ainda não há contratações carregadas neste ambiente. Você pode explorar os estados
              abaixo ou configurar um alerta para quando houver dados.
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-border py-10" aria-labelledby="como-usar">
        <h2 id="como-usar" className="font-display text-xl text-text">
          Como usar
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          <li>
            <p className="font-mono text-xs text-accent">01</p>
            <p className="mt-1 font-medium text-text">Digite o que procura</p>
            <p className="mt-1 text-sm text-text-muted">
              Ex.: merenda, software, obra — buscamos no texto do objeto da contratação.
            </p>
          </li>
          <li>
            <p className="font-mono text-xs text-accent">02</p>
            <p className="mt-1 font-medium text-text">Afine com filtros</p>
            <p className="mt-1 text-sm text-text-muted">
              Na busca, filtre por UF, município, modalidade, valor ou período.
            </p>
          </li>
          <li>
            <p className="font-mono text-xs text-accent">03</p>
            <p className="mt-1 font-medium text-text">Acompanhe no RSS</p>
            <p className="mt-1 text-sm text-text-muted">
              Salve um alerta no Feedly (ou similar) e receba novidades sem abrir o site todo dia.
            </p>
          </li>
        </ol>
      </section>

      <section className="border-b border-border py-10" aria-labelledby="explorar">
        <h2 id="explorar" className="font-display text-xl text-text">
          {hasData ? 'Experimente uma busca' : 'Explore por estado'}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {hasData
            ? 'Toque em um tema para ver resultados.'
            : 'Abra um estado para ver a página correspondente. Os resultados aparecem quando houver dados indexados.'}
        </p>

        {hasData ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {EXEMPLOS.map((ex) => (
              <li key={ex.q}>
                <Link
                  href={`/busca?q=${encodeURIComponent(ex.q)}`}
                  className="inline-flex min-h-11 items-center border border-border bg-bg-elevated px-3 text-sm text-text no-underline hover:border-accent"
                >
                  {ex.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {UFS_DESTAQUE.map((sigla) => (
              <li key={sigla}>
                <Link
                  href={`/uf/${sigla}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center border border-border bg-bg-elevated px-3 text-sm text-text no-underline hover:border-accent"
                >
                  {sigla}
                  <span className="sr-only"> — {UFS[sigla]}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/uf/SP"
                className="inline-flex min-h-11 items-center px-2 text-sm text-link no-underline hover:underline"
              >
                Ver todos →
              </Link>
            </li>
          </ul>
        )}
      </section>

      <section className="border-b border-border py-10" aria-labelledby="alertas">
        <div className="max-w-xl">
          <h2 id="alertas" className="font-display text-xl text-text">
            Receba alertas sem cadastro
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Monte um feed RSS com a palavra-chave e o estado que importam para você. Cole no
            leitor de notícias e acompanhe novas contratações.
          </p>
          <p className="mt-5">
            <Link
              href="/alertas"
              className="inline-flex min-h-11 items-center rounded-sm bg-accent px-4 text-sm font-medium text-bg no-underline hover:bg-accent-dim"
            >
              Criar alerta RSS
            </Link>
          </p>
        </div>
      </section>

      <section className="py-10" aria-labelledby="leitores-rss">
        <h2 id="leitores-rss" className="font-display text-xl text-text">
          Baixe um leitor RSS
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Escolha um app, instale e cole a URL do seu alerta. Todos abaixo são gratuitos (alguns
          têm planos pagos opcionais).
        </p>
        <RssReadersGrid />
      </section>
    </PageShell>
  );
}
