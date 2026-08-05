'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { UFS } from '@/lib/constants';

type Props = {
  initialQ: string;
  initialUf: string;
  /** URL canônica do servidor (fallback se window não existir) */
  siteUrl: string;
};

function buildQuery(q: string, uf: string): string {
  const params = new URLSearchParams();
  const trimmed = q.trim();
  if (trimmed) params.set('q', trimmed);
  if (uf) params.set('uf', uf);
  return params.toString();
}

export function AlertasBuilder({ initialQ, initialUf, siteUrl }: Props) {
  const [q, setQ] = useState(initialQ);
  const [uf, setUf] = useState(initialUf);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [origin, setOrigin] = useState(siteUrl.replace(/\/$/, ''));

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const query = useMemo(() => buildQuery(q, uf), [q, uf]);
  const feedPath = query ? `/rss?${query}` : '/rss';
  const feedUrl = `${origin}${feedPath}`;
  const buscaPath = query ? `/busca?${query}` : '/busca';
  const canSubscribe = q.trim().length > 0 || uf.length > 0;

  async function copyFeed() {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="mt-8 max-w-xl space-y-6">
      <ol className="space-y-2 text-sm text-text-muted">
        <li>
          <span className="font-medium text-text">1.</span> Escolha o que quer acompanhar
        </li>
        <li>
          <span className="font-medium text-text">2.</span> Copie a URL do feed
        </li>
        <li>
          <span className="font-medium text-text">3.</span> Cole no seu leitor RSS (Feedly,
          NetNewsWire, Thunderbird…)
        </li>
      </ol>

      <section className="surface rounded-sm p-5" aria-labelledby="filtros-alerta">
        <h2 id="filtros-alerta" className="font-display text-lg text-text">
          Filtro do alerta
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="q" className="block text-xs font-medium text-text-muted">
              Palavra-chave
            </label>
            <input
              id="q"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-1 w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm text-text"
              placeholder="Ex.: software, merenda escolar, pavimentação…"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-text-muted">
              Busca no objeto da contratação (texto em português).
            </p>
          </div>
          <div>
            <label htmlFor="uf" className="block text-xs font-medium text-text-muted">
              Estado (UF)
            </label>
            <select
              id="uf"
              name="uf"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="mt-1 w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm text-text"
            >
              <option value="">Todos os estados</option>
              {Object.entries(UFS).map(([sigla, nome]) => (
                <option key={sigla} value={sigla}>
                  {sigla} — {nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="surface rounded-sm p-5" aria-labelledby="url-feed">
        <h2 id="url-feed" className="font-display text-lg text-text">
          Sua URL do feed
        </h2>
        {!canSubscribe ? (
          <p className="mt-3 text-sm text-text-muted" role="status">
            Digite uma palavra-chave ou escolha um estado para gerar o feed.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs text-text-muted">
              Atualiza na hora conforme você altera o filtro
              {uf ? ` · UF ${uf}` : ''}
              {q.trim() ? ` · “${q.trim()}”` : ''}.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <p
                className="min-w-0 flex-1 break-all rounded-sm border border-border bg-bg px-3 py-2 font-mono text-xs text-text"
                data-testid="feed-url"
              >
                {feedUrl}
              </p>
              <button
                type="button"
                onClick={copyFeed}
                className="shrink-0 rounded-sm bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent-dim"
              >
                {copied ? 'Copiado!' : 'Copiar URL'}
              </button>
            </div>
            {copyError ? (
              <p className="mt-2 text-xs text-danger" role="alert">
                Não foi possível copiar. Selecione a URL e copie manualmente (Ctrl+C).
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href={buscaPath} className="font-medium">
                Pré-visualizar na busca
              </Link>
              <a href={feedPath} className="text-text-muted">
                Ver XML bruto
              </a>
            </div>
          </>
        )}
      </section>

      <section className="text-sm text-text-muted">
        <h2 className="font-display text-base text-text">Como usar</h2>
        <p className="mt-2">
          No Feedly (ou similar): adicione uma fonte → cole a URL copiada. Novas contratações que
          baterem com o filtro aparecem no leitor — sem criar conta aqui.
        </p>
        <p className="mt-2">
          Exemplos rápidos:{' '}
          <button
            type="button"
            className="text-link underline-offset-2 hover:underline"
            onClick={() => {
              setQ('software');
              setUf('SP');
            }}
          >
            software em SP
          </button>
          {' · '}
          <button
            type="button"
            className="text-link underline-offset-2 hover:underline"
            onClick={() => {
              setQ('merenda');
              setUf('');
            }}
          >
            merenda (Brasil)
          </button>
        </p>
      </section>
    </div>
  );
}
