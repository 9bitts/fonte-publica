import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocalFiltersForm } from '@/components/local-filters';
import { ResultsTable } from '@/components/results-table';
import { EmptyState, ErrorState, PageShell } from '@/components/ui';
import { buildContratacaoWhere, pickLocalFilters } from '@/lib/contratacao-filters';
import { prisma } from '@/lib/db';
import { formatCentavos } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const orgao = await prisma.orgao.findFirst({
      where: { OR: [{ slug }, { id: slug }, { cnpj: slug }] },
      select: { razaoSocial: true, cnpj: true },
    });
    if (!orgao) return { title: 'Órgão não encontrado' };
    return {
      title: orgao.razaoSocial,
      description: `Contratações do órgão ${orgao.razaoSocial} (CNPJ ${orgao.cnpj}) no PNCP.`,
      alternates: { canonical: `/orgao/${slug}` },
    };
  } catch {
    return { title: 'Órgão' };
  }
}

export default async function OrgaoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = pickLocalFilters(await searchParams);

  try {
    const orgao = await prisma.orgao.findFirst({
      where: { OR: [{ slug }, { id: slug }, { cnpj: slug }] },
      include: {
        _count: { select: { contratacoes: true } },
        unidades: { take: 20, include: { municipio: true }, orderBy: { nomeUnidade: 'asc' } },
      },
    });
    if (!orgao) notFound();

    const where = buildContratacaoWhere({ orgaoId: orgao.id }, filters);

    const recentes = await prisma.contratacao.findMany({
      where,
      orderBy: { dataPublicacao: 'desc' },
      take: 30,
      include: { orgao: { select: { id: true, razaoSocial: true, slug: true, cnpj: true } } },
    });

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'GovernmentOrganization',
      name: orgao.razaoSocial,
      taxID: orgao.cnpj,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/orgao/${orgao.slug}`,
    };

    return (
      <PageShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="font-display text-3xl font-semibold text-text">{orgao.razaoSocial}</h1>
        <p className="mt-2 font-mono text-sm text-text-muted">
          CNPJ {orgao.cnpj}
          {orgao.esferaId ? ` · esfera ${orgao.esferaId}` : ''}
          {orgao.poderId ? ` · poder ${orgao.poderId}` : ''}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {orgao._count.contratacoes.toLocaleString('pt-BR')} contratações indexadas
        </p>

        <LocalFiltersForm
          action={`/orgao/${orgao.slug}`}
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
                  : 'Nenhuma contratação indexada para este órgão com esses filtros.'
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

        {orgao.unidades.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-display text-lg text-text">Unidades compradoras</h2>
            <ul className="mt-3 space-y-1 text-sm text-text-muted">
              {orgao.unidades.map((u) => (
                <li key={u.id}>
                  {u.nomeUnidade}
                  {u.municipio ? (
                    <>
                      {' · '}
                      <Link href={`/municipio/${u.municipio.slug}`}>{u.municipio.nome}</Link>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-6 text-xs text-text-muted">
          Maior valor nesta lista:{' '}
          {recentes[0]
            ? formatCentavos(
                recentes.reduce((max, c) => (c.valorEstimado > max ? c.valorEstimado : max), 0n),
              )
            : '—'}
        </p>
      </PageShell>
    );
  } catch (err) {
    return (
      <PageShell>
        <ErrorState message={err instanceof Error ? err.message : 'Falha ao carregar órgão'} />
      </PageShell>
    );
  }
}
