import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResultsTable } from '@/components/results-table';
import { EmptyState, ErrorState, PageShell } from '@/components/ui';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

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

export default async function MunicipioPage({ params }: Props) {
  const { slug } = await params;

  try {
    const municipio = await prisma.municipio.findUnique({
      where: { slug },
      include: { uf: true },
    });
    if (!municipio) notFound();

    const recentes = await prisma.contratacao.findMany({
      where: { municipioCodigoIbge: municipio.codigoIbge },
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
          <Link href={`/busca?municipio=${encodeURIComponent(municipio.nome)}&uf=${municipio.ufSigla}`}>
            Busca
          </Link>
        </p>

        <section className="mt-8">
          <h2 className="font-display text-lg text-text">Contratações</h2>
          {recentes.length === 0 ? (
            <EmptyState
              title="Vazio"
              description="Nenhuma contratação indexada para este município."
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
        <ErrorState message={err instanceof Error ? err.message : 'Falha ao carregar município'} />
      </PageShell>
    );
  }
}
