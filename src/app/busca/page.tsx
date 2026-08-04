import Link from 'next/link';
import type { Metadata } from 'next';
import { ResultsTable } from '@/components/results-table';
import { SearchBox } from '@/components/search-box';
import { EmptyState, ErrorState, PageShell } from '@/components/ui';
import { MODALIDADES, SITUACOES, UFS } from '@/lib/constants';
import { searchContratacoes } from '@/lib/search';
import { buscaQuerySchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const title = q ? `Busca: ${q}` : 'Busca de contratações';
  return {
    title,
    alternates: {
      canonical: `/busca${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    },
  };
}

function pick(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key];
  return typeof v === 'string' ? v : undefined;
}

export default async function BuscaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = {
    q: pick(sp, 'q'),
    uf: pick(sp, 'uf'),
    municipio: pick(sp, 'municipio'),
    modalidade: pick(sp, 'modalidade'),
    situacao: pick(sp, 'situacao'),
    valorMin: pick(sp, 'valorMin'),
    valorMax: pick(sp, 'valorMax'),
    de: pick(sp, 'de'),
    ate: pick(sp, 'ate'),
    cursor: pick(sp, 'cursor'),
    limit: pick(sp, 'limit') ?? '20',
  };

  const parsed = buscaQuerySchema.safeParse(raw);
  let error: string | null = null;
  let items: Awaited<ReturnType<typeof searchContratacoes>>['items'] = [];
  let nextCursor: string | null = null;

  if (!parsed.success) {
    error = 'Filtros inválidos. Verifique UF, datas (YYYY-MM-DD) e valores.';
  } else {
    try {
      const result = await searchContratacoes(parsed.data);
      items = result.items;
      nextCursor = result.nextCursor;
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : 'Não foi possível consultar o banco. Verifique se Postgres está no ar e a ingestão rodou.';
    }
  }

  const data = parsed.success ? parsed.data : null;
  const rssParams = new URLSearchParams();
  if (data?.q) rssParams.set('q', data.q);
  if (data?.uf) rssParams.set('uf', data.uf);

  return (
    <PageShell>
      <h1 className="font-display text-3xl font-semibold text-text">Busca</h1>
      <p className="mt-1 text-sm text-text-muted">
        Full-text em português com ranking. Valores em reais nos filtros; persistidos em centavos.
      </p>

      <div className="mt-6">
        <SearchBox initialQ={data?.q ?? ''} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="surface h-fit rounded-sm p-4" aria-label="Filtros">
          <h2 className="font-display text-base text-text">Filtros</h2>
          <form className="mt-3 space-y-3 text-sm" method="get">
            {data?.q ? <input type="hidden" name="q" value={data.q} /> : null}
            <div>
              <label htmlFor="uf" className="block text-xs text-text-muted">
                UF
              </label>
              <select
                id="uf"
                name="uf"
                defaultValue={data?.uf ?? ''}
                className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-1.5"
              >
                <option value="">Todas</option>
                {Object.entries(UFS).map(([sigla, nome]) => (
                  <option key={sigla} value={sigla}>
                    {sigla} — {nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="municipio" className="block text-xs text-text-muted">
                Município
              </label>
              <input
                id="municipio"
                name="municipio"
                defaultValue={data?.municipio ?? ''}
                className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-1.5"
              />
            </div>
            <div>
              <label htmlFor="modalidade" className="block text-xs text-text-muted">
                Modalidade
              </label>
              <select
                id="modalidade"
                name="modalidade"
                defaultValue={data?.modalidade?.toString() ?? ''}
                className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-1.5"
              >
                <option value="">Todas</option>
                {Object.entries(MODALIDADES).map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="situacao" className="block text-xs text-text-muted">
                Situação
              </label>
              <select
                id="situacao"
                name="situacao"
                defaultValue={data?.situacao?.toString() ?? ''}
                className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-1.5"
              >
                <option value="">Todas</option>
                {Object.entries(SITUACOES).map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="valorMin" className="block text-xs text-text-muted">
                  Valor mín. (R$)
                </label>
                <input
                  id="valorMin"
                  name="valorMin"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={data?.valorMin ?? ''}
                  className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-1.5"
                />
              </div>
              <div>
                <label htmlFor="valorMax" className="block text-xs text-text-muted">
                  Valor máx. (R$)
                </label>
                <input
                  id="valorMax"
                  name="valorMax"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={data?.valorMax ?? ''}
                  className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="de" className="block text-xs text-text-muted">
                  De
                </label>
                <input
                  id="de"
                  name="de"
                  type="date"
                  defaultValue={data?.de ?? ''}
                  className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-1.5"
                />
              </div>
              <div>
                <label htmlFor="ate" className="block text-xs text-text-muted">
                  Até
                </label>
                <input
                  id="ate"
                  name="ate"
                  type="date"
                  defaultValue={data?.ate ?? ''}
                  className="mt-1 w-full rounded-sm border border-border bg-bg px-2 py-1.5"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-sm bg-accent px-3 py-2 text-sm font-medium text-bg hover:bg-accent-dim"
            >
              Aplicar
            </button>
          </form>
          <p className="mt-4 text-xs text-text-muted">
            <Link href={`/rss?${rssParams.toString()}`}>Assinar esta busca via RSS</Link>
          </p>
        </aside>

        <div className="space-y-4">
          {error ? <ErrorState message={error} /> : null}
          {!error && items.length === 0 ? (
            <EmptyState
              title="Nenhum resultado"
              description="Não há contratações indexadas para esses filtros. Ajuste a busca ou rode a ingestão."
            />
          ) : null}
          {!error && items.length > 0 ? (
            <>
              <p className="text-sm text-text-muted">
                Exibindo {items.length} resultado{items.length === 1 ? '' : 's'}
                {data?.q ? ` para “${data.q}”` : ''}.
              </p>
              <ResultsTable items={items} />
              {nextCursor ? (
                <p>
                  <Link
                    href={`/busca?${new URLSearchParams({
                      ...Object.fromEntries(
                        Object.entries(raw).filter(([, v]) => typeof v === 'string' && v),
                      ),
                      cursor: nextCursor,
                    } as Record<string, string>).toString()}`}
                    className="text-sm"
                  >
                    Próxima página →
                  </Link>
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
