import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocalFiltersForm } from '@/components/local-filters';
import { ResultsTable } from '@/components/results-table';
import { EmptyState, ErrorState, PageShell } from '@/components/ui';
import { UFS } from '@/lib/constants';
import { buildContratacaoWhere, pickLocalFilters } from '@/lib/contratacao-filters';
import { prisma } from '@/lib/db';
import { dbErrorMessage } from '@/lib/db-errors';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ sigla: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function UfPage({ params, searchParams }: Props) {
  const { sigla } = await params;
  const upper = sigla.toUpperCase();
  if (!UFS[upper]) notFound();

  const sp = await searchParams;
  const filters = pickLocalFilters(sp);
  const where = buildContratacaoWhere({ ufSigla: upper }, filters);

  try {
    const [total, totalFiltrado, municipios, recentes] = await Promise.all([
      prisma.contratacao.count({ where: { ufSigla: upper } }),
      prisma.contratacao.count({ where }),
      prisma.municipio.findMany({
        where: { ufSigla: upper },
        orderBy: { nome: 'asc' },
        take: 40,
      }),
      prisma.contratacao.findMany({
        where,
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

    const buscaParams = new URLSearchParams({ uf: upper });
    if (filters.de) buscaParams.set('de', filters.de);
    if (filters.ate) buscaParams.set('ate', filters.ate);
    if (filters.aberto) buscaParams.set('aberto', '1');

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
          {totalFiltrado.toLocaleString('pt-BR')} nesta lista
          {total !== totalFiltrado
            ? ` (${total.toLocaleString('pt-BR')} no total nesta UF)`
            : ' indexadas'}
          {' · '}
          <Link href={`/busca?${buscaParams.toString()}`}>Abrir na busca</Link>
          {' · '}
          <Link href={`/alertas?uf=${upper}`}>RSS</Link>
        </p>

        <LocalFiltersForm
          action={`/uf/${upper}`}
          de={filters.de}
          ate={filters.ate}
          aberto={filters.aberto ?? true}
        />
        <p className="mt-2 text-xs text-text-muted">
          “Em aberto” = ainda dá para enviar proposta (prazo não encerrou e situação divulgada no
          PNCP).
        </p>

        <section className="mt-8">
          <h2 className="font-display text-lg text-text">Municípios</h2>
          {municipios.length === 0 ? (
            <EmptyState
              title="Sem municípios"
              description="Ainda não há municípios indexados nesta UF. Eles aparecem após a ingestão de contratações."
            />
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
          <h2 className="font-display text-lg text-text">
            {filters.aberto ? 'Propostas em aberto' : 'Contratações'}
          </h2>
          {recentes.length === 0 ? (
            <EmptyState
              title="Nenhum resultado"
              description={
                filters.aberto
                  ? 'Não há propostas em aberto com esses filtros. Troque o período ou escolha “Todas”.'
                  : 'Nenhuma contratação indexada nesta UF com esses filtros.'
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

        <nav className="mt-8 flex flex-wrap gap-2 text-sm" aria-label="Outras UFs">
          {Object.keys(UFS).map((s) => (
            <Link
              key={s}
              href={`/uf/${s}`}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center border px-3 no-underline ${
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
        <ErrorState message={dbErrorMessage(err)} />
      </PageShell>
    );
  }
}
