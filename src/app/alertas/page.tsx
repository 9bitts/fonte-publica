import type { Metadata } from 'next';
import { AlertasBuilder } from '@/components/alertas-builder';
import { RssReadersGrid } from '@/components/rss-readers';
import { PageShell } from '@/components/ui';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Alertas RSS',
  description:
    'Receba contratações públicas do PNCP no seu leitor RSS, por palavra-chave e UF — sem cadastro.',
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

  return (
    <PageShell>
      <h1 className="font-display text-3xl font-semibold text-text">Alertas por RSS</h1>
      <p className="mt-2 max-w-2xl text-base text-text-muted">
        Acompanhe licitações e contratos novos no aplicativo de notícias que você já usa. Sem
        e-mail, sem conta na Fonte Pública.
      </p>
      <AlertasBuilder initialQ={q} initialUf={uf} siteUrl={getSiteUrl()} />

      <section className="mt-12 border-t border-border pt-10" aria-labelledby="leitores-rss">
        <h2 id="leitores-rss" className="font-display text-xl text-text">
          Não tem leitor ainda? Baixe um
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Instale, abra o app e cole a URL do feed que você copiou acima.
        </p>
        <RssReadersGrid />
      </section>
    </PageShell>
  );
}
