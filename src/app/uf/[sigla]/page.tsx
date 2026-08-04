import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResultsTable } from '@/components/results-table';
import { EmptyState, ErrorState, PageShell } from '@/components/ui';
import { UFS } from '@/lib/constants';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ sigla: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sigla } = await params;
  const upper = sigla.toUpperCase();
  const nome = UFS[upper] ?? upper;
  return {
    title: `Contratações em ${nome} (${upper})`,
    description: `Licitações e contratos públicos indexados do PNCP em ${nome}.`,
    alternates: { canonical: `/uf/${upper}` },
  };
}

export default async function UfPage({ params }: Props) {
  const { sigla } = await params;
  const upper = sigla.toUpperCase();
  if (!UFS[upper]) notFound();

  try {
    const [total, municipios, recentes] = await Promise.all([
      prisma.contratacao.count({ where: { ufSigla: upper } }),
      prisma.municipio.findMany({
        where: { ufSigla: upper },
        orderBy: { nome: 'asc' },
        take: 40,
      }),
      prisma.contratacao.findMany({
        where: { ufSigla: upper },
        orderBy: { dataPublicacao: 'desc' },
        take: 30,
        include: { orgao: { select: { id: true, razaoSocial: true, slug: true, cnpj: true } } },
      }),
    ]);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `Contratações PNCP — ${UFS[upper]}`,
      spatialCoverage: { '@type': 'AdministrativeArea', name: UFS[upper] },
    };

    return (
      <PageShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="font-display text-3xl font-semibold text-text">
          {UFS[upper]} <span className="text-text-muted">({upper})</span>
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {total.toLocaleString('pt-BR')} contratações indexadas ·{' '}
          <Link href={`/busca?uf=${upper}`}>Abrir na busca</Link> ·{' '}
          <Link href={`/rss?uf=${upper}`}>RSS</Link>
        </p>

        <section className="mt-8">
          <h2 className="font-display text-lg text-text">Municípios</h2>
          {municipios.length === 0 ? (
            <EmptyState title="Sem municípios" description="Ainda não há municípios indexados nesta UF." />
          ) : (
            <ul className="mt-3 columns-2 gap-4 text-sm md:columns-3">
              {municipios.map((m) => (
                <li key={m.id} className="mb-1 break-inside-avoid">
                  <Link href={`/municipio/${m.slug}`}>{m.nome}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-display text-lg text-text">Recentes</h2>
          {recentes.length === 0 ? (
            <EmptyState title="Vazio" description="Nenhuma contratação indexada nesta UF." />
          ) : (
            <div className="mt-3">
              <ResultsTable
                items={recentes.map((c) => ({
                  id: c.id,
                  numeroControlePNCP: c.numeroControlePNCP,
                  objetoCompra: c.objetoCompra,
                  modalidadeNome: c.modalidadeNome,
                  modalidadeId: c.modalidadeId,
                  situacaoNome: c.situacaoNome,
                  situacaoId: c.situacaoId,
                  valorEstimado: c.valorEstimado.toString(),
                  dataPublicacao: c.dataPublicacao,
                  ufSigla: c.ufSigla,
                  municipioNome: c.municipioNome,
                  orgao: c.orgao,
                }))}
              />
            </div>
          )}
        </section>

        <nav className="mt-8 flex flex-wrap gap-2 text-sm" aria-label="Outras UFs">
          {Object.keys(UFS).map((s) => (
            <Link
              key={s}
              href={`/uf/${s}`}
              className={`border px-2 py-1 no-underline ${
                s === upper ? 'border-accent text-text' : 'border-border text-text-muted'
              }`}
            >
              {s}
            </Link>
          ))}
        </nav>
      </PageShell>
    );
  } catch (err) {
    return (
      <PageShell>
        <ErrorState message={err instanceof Error ? err.message : 'Falha ao carregar UF'} />
      </PageShell>
    );
  }
}
