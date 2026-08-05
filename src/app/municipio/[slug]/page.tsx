import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocalFiltersForm } from '@/components/local-filters';
import { ResultsTable } from '@/components/results-table';
import { EmptyState, ErrorState, PageShell } from '@/components/ui';
import { buildContratacaoWhere, pickLocalFilters } from '@/lib/contratacao-filters';
import { prisma } from '@/lib/db';
import { dbErrorMessage } from '@/lib/db-errors';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const m = await prisma.municipio.findUnique({ where: { slug } });
    if (!m) return { title: 'Município não encontrado' };
    return {
      title: `Contratações em ${m.nome}/${m.ufSigla}`,
      description: `Licitações e contratos públicos em ${m.nome} (${m.ufSigla}) indexados do PNCP.`,
      alternates: { canonical: `/municipio/${slug}` },
    };
  } catch {
    return { title: 'Município' };
  }
}

export default async function MunicipioPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = pickLocalFilters(await searchParams);

  try {
    const municipio = await prisma.municipio.findUnique({
      where: { slug },
      include: { uf: true },
    });
    if (!municipio) notFound();

    const where = buildContratacaoWhere(
      { municipioCodigoIbge: municipio.codigoIbge },
      filters,
    );

    const recentes = await prisma.contratacao.findMany({
      where,
      orderBy: { dataPublicacao: 'desc' },
      take: 40,
      include: { orgao: { select: { id: true, razaoSocial: true, slug: true, cnpj: true } } },
    });

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `Contratações PNCP — ${municipio.nome}/${municipio.ufSigla}`,
      spatialCoverage: {
        '@type': 'City',
        name: municipio.nome,
        containedInPlace: { '@type': 'State', name: municipio.uf.nome },
      },
    };

    return (
      <PageShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="font-display text-3xl font-semibold text-text">
          {municipio.nome}
          <span className="text-text-muted">/{municipio.ufSigla}</span>
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          IBGE {municipio.codigoIbge} ·{' '}
          <Link href={`/uf/${municipio.ufSigla}`}>{municipio.uf.nome}</Link> ·{' '}
          <Link
            href={`/busca?municipio=${encodeURIComponent(municipio.nome)}&uf=${municipio.ufSigla}`}
          >
            Busca
          </Link>
        </p>

        <LocalFiltersForm
          action={`/municipio/${municipio.slug}`}
          de={filters.de}
          ate={filters.ate}
          aberto={filters.aberto ?? true}
        />
        <p className="mt-2 text-xs text-text-muted">
          “Em aberto” = ainda dá para enviar proposta (prazo não encerrou e situação divulgada no
          PNCP).
        </p>

        <section className="mt-8">
          <h2 className="font-display text-lg text-text">
            {filters.aberto ? 'Propostas em aberto' : 'Contratações'}
          </h2>
          {recentes.length === 0 ? (
            <EmptyState
              title="Nenhum resultado"
              description={
                filters.aberto
                  ? 'Não há propostas em aberto com esses filtros. Troque o período ou escolha “Todas”.'
                  : 'Nenhuma contratação indexada para este município com esses filtros.'
              }
            />
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
      </PageShell>
    );
  } catch (err) {
    return (
      <PageShell>
        <ErrorState message={dbErrorMessage(err)} />
      </PageShell>
    );
  }
}
