import Link from 'next/link';
import type { Metadata } from 'next';
import { SearchBox } from '@/components/search-box';
import { PageShell } from '@/components/ui';
import { countContratacoes } from '@/lib/search';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fonte Pública — radar de licitações e contratos do PNCP',
  alternates: { canonical: '/' },
};

const EXEMPLOS = [
  { q: 'software', label: 'software' },
  { q: 'merenda escolar', label: 'merenda escolar' },
  { q: 'pavimentação', label: 'pavimentação' },
  { q: 'medicamentos', label: 'medicamentos' },
];

export default async function HomePage() {
  const total = await countContratacoes();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Fonte Pública — contratações PNCP',
    description:
      'Índice pesquisável de contratações públicas brasileiras provenientes do Portal Nacional de Contratações Públicas.',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
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
        <div className="relative max-w-3xl">
          <p className="font-display text-4xl font-semibold tracking-tight text-text md:text-5xl">
            Fonte Pública
          </p>
          <h1 className="mt-4 text-xl font-medium text-text md:text-2xl">
            Radar de licitações e contratos do PNCP
          </h1>
          <p className="mt-3 max-w-2xl text-base text-text-muted">
            Indexamos contratações do Portal Nacional de Contratações Públicas para busca
            full-text, filtros por local e modalidade, páginas por órgão/UF e alertas RSS por
            palavra-chave — sem paywall e sem chute.
          </p>
          <div className="mt-6">
            <SearchBox large />
          </div>
          <p className="mt-3 font-mono text-xs text-text-muted">
            {total > 0
              ? `${total.toLocaleString('pt-BR')} contratações indexadas`
              : 'Nenhuma contratação indexada ainda — rode a ingestão para popular o banco.'}
          </p>
        </div>
      </section>

      <section className="grid gap-8 border-b border-border py-10 md:grid-cols-3">
        <div>
          <h2 className="font-display text-lg text-text">Busca em português</h2>
          <p className="mt-2 text-sm text-text-muted">
            Ranking full-text (`ts_rank`) sobre o objeto da contratação, com filtros de UF,
            município, modalidade, valor e período.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-text">Cauda longa SEO</h2>
          <p className="mt-2 text-sm text-text-muted">
            Páginas estáticas por órgão, UF e município, com metadados, JSON-LD e sitemap
            dinâmico.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-text">Alerta via RSS</h2>
          <p className="mt-2 text-sm text-text-muted">
            Monte um feed com `q` e `uf` e acompanhe novas contratações no leitor de sua
            preferência — sem cadastro.
          </p>
        </div>
      </section>

      <section className="py-10">
        <h2 className="font-display text-lg text-text">Exemplos de busca</h2>
        <p className="mt-1 text-sm text-text-muted">Clique para abrir resultados reais do índice.</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {EXEMPLOS.map((ex) => (
            <li key={ex.q}>
              <Link
                href={`/busca?q=${encodeURIComponent(ex.q)}`}
                className="inline-block border border-border bg-bg-elevated px-3 py-1.5 text-sm text-text no-underline hover:border-accent"
              >
                {ex.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="surface mt-8 rounded-sm p-5">
          <h3 className="font-display text-base text-text">Receba alertas por RSS</h3>
          <p className="mt-2 text-sm text-text-muted">
            Exemplo:{' '}
            <Link href="/rss?q=tecnologia&uf=SP" className="font-mono text-xs">
              /rss?q=tecnologia&amp;uf=SP
            </Link>
          </p>
          <p className="mt-3">
            <Link
              href="/rss?q=tecnologia&uf=SP"
              className="inline-block rounded-sm bg-accent px-4 py-2 text-sm font-medium text-bg no-underline hover:bg-accent-dim"
            >
              Abrir feed de exemplo
            </Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
