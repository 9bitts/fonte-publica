import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EmptyState, ErrorState, PageShell } from '@/components/ui';
import { dbErrorMessage } from '@/lib/db-errors';
import { prisma } from '@/lib/db';
import { formatCentavos, formatDateBr, formatDateTimeBr } from '@/lib/format';
import { safeHttpUrl } from '@/lib/security';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const c = await prisma.contratacao.findFirst({
      where: { OR: [{ id }, { numeroControlePNCP: id }] },
      select: { objetoCompra: true, numeroControlePNCP: true },
    });
    if (!c) return { title: 'Contratação não encontrada' };
    return {
      title: c.objetoCompra.slice(0, 80),
      description: `Contratação PNCP ${c.numeroControlePNCP}`,
      alternates: { canonical: `/contratacao/${id}` },
    };
  } catch {
    return { title: 'Contratação' };
  }
}

export default async function ContratacaoPage({ params }: Props) {
  const { id } = await params;

  try {
    const c = await prisma.contratacao.findFirst({
      where: { OR: [{ id }, { numeroControlePNCP: id }] },
      include: {
        orgao: true,
        unidade: { include: { municipio: true } },
        itens: { orderBy: { numeroItem: 'asc' } },
      },
    });

    if (!c) {
      notFound();
    }

    const relacionadas = await prisma.contratacao.findMany({
      where: { orgaoId: c.orgaoId, NOT: { id: c.id } },
      orderBy: { dataPublicacao: 'desc' },
      take: 5,
      select: {
        id: true,
        objetoCompra: true,
        dataPublicacao: true,
        valorEstimado: true,
      },
    });

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'GovernmentService',
      name: c.objetoCompra.slice(0, 120),
      description: c.objetoCompra,
      provider: {
        '@type': 'GovernmentOrganization',
        name: c.orgao.razaoSocial,
        taxID: c.orgao.cnpj,
      },
      areaServed: c.ufSigla
        ? { '@type': 'AdministrativeArea', name: c.ufSigla }
        : { '@type': 'Country', name: 'Brasil' },
    };

    const origemUrl = safeHttpUrl(c.linkSistemaOrigem);

    return (
      <PageShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <p className="font-mono text-xs text-text-muted">{c.numeroControlePNCP}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-text md:text-3xl">
          {c.objetoCompra}
        </h1>

        <dl className="surface mt-6 grid gap-4 rounded-sm p-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-text-muted">Órgão</dt>
            <dd>
              <Link href={`/orgao/${c.orgao.slug}`}>{c.orgao.razaoSocial}</Link>
              <div className="font-mono text-xs text-text-muted">CNPJ {c.orgao.cnpj}</div>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Local</dt>
            <dd>
              {c.unidade?.municipio ? (
                <Link href={`/municipio/${c.unidade.municipio.slug}`}>
                  {c.municipioNome}/{c.ufSigla}
                </Link>
              ) : (
                [c.municipioNome, c.ufSigla].filter(Boolean).join('/') || '—'
              )}
              {c.ufSigla ? (
                <div>
                  <Link href={`/uf/${c.ufSigla}`}>Ver UF {c.ufSigla}</Link>
                </div>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Modalidade</dt>
            <dd>{c.modalidadeNome}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Situação</dt>
            <dd>{c.situacaoNome}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Valor estimado</dt>
            <dd className="font-mono">{formatCentavos(c.valorEstimado)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Valor homologado</dt>
            <dd className="font-mono">{formatCentavos(c.valorHomologado)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Publicação PNCP</dt>
            <dd>{formatDateBr(c.dataPublicacao)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Propostas</dt>
            <dd>
              {formatDateTimeBr(c.dataAberturaProposta)} →{' '}
              {formatDateTimeBr(c.dataEncerramentoProposta)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Processo / compra</dt>
            <dd className="font-mono text-xs">
              {c.processo ?? '—'} · {c.numeroCompra ?? '—'} / {c.anoCompra}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Unidade</dt>
            <dd>{c.unidade?.nomeUnidade ?? '—'}</dd>
          </div>
        </dl>

        {c.informacaoComplementar ? (
          <section className="mt-6">
            <h2 className="font-display text-lg text-text">Informação complementar</h2>
            <p className="prose-dense mt-2 text-sm text-text-muted whitespace-pre-wrap">
              {c.informacaoComplementar}
            </p>
          </section>
        ) : null}

        {origemUrl ? (
          <p className="mt-4 text-sm">
            <a href={origemUrl} rel="noopener noreferrer" target="_blank">
              Abrir no sistema de origem
            </a>
          </p>
        ) : null}

        <section className="mt-8">
          <h2 className="font-display text-lg text-text">Itens</h2>
          {c.itens.length === 0 ? (
            <EmptyState
              title="Sem itens indexados"
              description="A listagem de publicação do PNCP não inclui itens; a coleta detalhada é best-effort."
            />
          ) : (
            <div className="surface mt-3 overflow-x-auto rounded-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-muted text-xs text-text-muted">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {c.itens.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono text-xs">{item.numeroItem}</td>
                      <td className="px-3 py-2">{item.descricao}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {formatCentavos(item.valorTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {relacionadas.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-display text-lg text-text">Outras do mesmo órgão</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {relacionadas.map((r) => (
                <li key={r.id}>
                  <Link href={`/contratacao/${r.id}`}>
                    {r.objetoCompra.slice(0, 120)}
                    {r.objetoCompra.length > 120 ? '…' : ''}
                  </Link>
                  <span className="ml-2 text-xs text-text-muted">
                    {formatDateBr(r.dataPublicacao)} · {formatCentavos(r.valorEstimado)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
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
