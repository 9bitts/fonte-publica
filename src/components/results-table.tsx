import Link from 'next/link';
import { formatCentavos, formatDateBr } from '@/lib/format';
import type { ContratacaoListItem } from '@/lib/search';

function ResultCard({ item }: { item: ContratacaoListItem }) {
  return (
    <article className="border-t border-border px-3 py-4 first:border-t-0">
      <p className="font-mono text-xs text-text-muted">{formatDateBr(item.dataPublicacao)}</p>
      <h3 className="mt-1 text-base font-medium leading-snug text-text">
        <Link href={`/contratacao/${item.id}`} className="text-text no-underline hover:underline">
          {item.objetoCompra.length > 140
            ? item.objetoCompra.slice(0, 140) + '…'
            : item.objetoCompra}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-text-muted">
        <Link href={`/orgao/${item.orgao.slug}`} className="text-link no-underline hover:underline">
          {item.orgao.razaoSocial}
        </Link>
        {[item.municipioNome, item.ufSigla].filter(Boolean).length > 0 ? (
          <span>
            {' '}
            · {[item.municipioNome, item.ufSigla].filter(Boolean).join('/')}
          </span>
        ) : null}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-xs text-text-muted">
        <span>{item.modalidadeNome}</span>
        <span className="font-mono text-text">{formatCentavos(BigInt(item.valorEstimado))}</span>
      </div>
    </article>
  );
}

export function ResultsTable({ items }: { items: ContratacaoListItem[] }) {
  if (items.length === 0) return null;

  return (
    <>
      {/* Mobile: lista em cards (sem scroll horizontal) */}
      <div className="surface rounded-sm md:hidden" role="list">
        {items.map((item) => (
          <div key={item.id} role="listitem">
            <ResultCard item={item} />
          </div>
        ))}
      </div>

      {/* Desktop/tablet: tabela */}
      <div className="surface hidden overflow-x-auto rounded-sm md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-bg-muted text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Publicação
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Objeto
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Órgão / Local
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Modalidade
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-right">
                Valor est.
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border align-top hover:bg-bg-muted/50">
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-text-muted">
                  {formatDateBr(item.dataPublicacao)}
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/contratacao/${item.id}`}
                    className="font-medium text-text no-underline hover:underline"
                  >
                    {item.objetoCompra.length > 160
                      ? item.objetoCompra.slice(0, 160) + '…'
                      : item.objetoCompra}
                  </Link>
                  <div className="mt-1 font-mono text-[11px] text-text-muted">
                    {item.numeroControlePNCP}
                  </div>
                </td>
                <td className="px-3 py-3 text-text-muted">
                  <Link
                    href={`/orgao/${item.orgao.slug}`}
                    className="text-link no-underline hover:underline"
                  >
                    {item.orgao.razaoSocial}
                  </Link>
                  <div className="mt-1 text-xs">
                    {[item.municipioNome, item.ufSigla].filter(Boolean).join(' / ') || '—'}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-text-muted">{item.modalidadeNome}</td>
                <td className="px-3 py-3 text-right font-mono text-xs">
                  {formatCentavos(BigInt(item.valorEstimado))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
