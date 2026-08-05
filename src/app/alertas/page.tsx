import Link from 'next/link';
import type { Metadata } from 'next';
import { PageShell } from '@/components/ui';
import { UFS } from '@/lib/constants';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Alertas RSS',
  description: 'Monte um feed RSS por palavra-chave e UF para acompanhar contratações do PNCP.',
  alternates: { canonical: '/alertas' },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function pick(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key];
  return typeof v === 'string' ? v : '';
}

export default async function AlertasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = pick(sp, 'q') || 'tecnologia';
  const uf = pick(sp, 'uf');

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (uf) params.set('uf', uf);
  const site = getSiteUrl();
  const feedPath = `/rss?${params.toString()}`;
  const feedUrl = `${site}${feedPath}`;

  return (
    <PageShell>
      <h1 className="font-display text-3xl font-semibold text-text">Alertas por RSS</h1>
      <p className="mt-2 max-w-2xl text-sm text-text-muted">
        O RSS não é uma página de resultados — é um feed para o leitor (Feedly, NetNewsWire,
        Thunderbird, etc.). Monte o filtro abaixo e copie a URL do feed.
      </p>

      <form className="surface mt-8 max-w-xl space-y-4 rounded-sm p-5" method="get">
        <div>
          <label htmlFor="q" className="block text-xs text-text-muted">
            Palavra-chave
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            className="mt-1 w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm"
            placeholder="ex.: software, merenda…"
          />
        </div>
        <div>
          <label htmlFor="uf" className="block text-xs text-text-muted">
            UF (opcional)
          </label>
          <select
            id="uf"
            name="uf"
            defaultValue={uf}
            className="mt-1 w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {Object.entries(UFS).map(([sigla, nome]) => (
              <option key={sigla} value={sigla}>
                {sigla} — {nome}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent-dim"
        >
          Atualizar URL do feed
        </button>
      </form>

      <div className="surface mt-6 max-w-xl rounded-sm p-5">
        <h2 className="font-display text-base text-text">URL do feed</h2>
        <p className="mt-2 break-all font-mono text-xs text-link">{feedUrl}</p>
        <p className="mt-4 text-sm">
          <a href={feedPath} className="font-medium">
            Abrir XML do feed
          </a>
          {' · '}
          <Link href={`/busca?${params.toString()}`}>Ver na busca</Link>
        </p>
        <p className="mt-3 text-xs text-text-muted">
          No Railway, defina também{' '}
          <span className="font-mono">NEXT_PUBLIC_SITE_URL=https://seu-dominio</span> para links
          absolutos corretos no XML.
        </p>
      </div>
    </PageShell>
  );
}
