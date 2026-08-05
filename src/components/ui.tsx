import Link from 'next/link';
import type { ReactNode } from 'react';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-bg-elevated">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-text no-underline"
        >
          Fonte Pública
        </Link>
        <nav aria-label="Principal" className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/busca" className="text-text-muted no-underline hover:text-text">
            Busca
          </Link>
          <Link href="/uf/SP" className="text-text-muted no-underline hover:text-text">
            Por UF
          </Link>
          <Link href="/alertas" className="text-text-muted no-underline hover:text-text">
            RSS
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-bg-elevated">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-text-muted">
        <p>
          Fonte Pública indexa dados abertos do{' '}
          <a href="https://pncp.gov.br" rel="noopener noreferrer" target="_blank">
            PNCP
          </a>
          . Não substitui o portal oficial.
        </p>
        <p>
          Feito por{' '}
          <a href="https://9bitts.dev/" rel="noopener noreferrer" target="_blank">
            9bitts
          </a>
        </p>
        <p className="font-mono text-xs">Timezone: America/Sao_Paulo · valores em BRL</p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="surface rounded-sm p-8 text-center" role="status">
      <h2 className="font-display text-lg text-text">{title}</h2>
      <p className="mt-2 text-sm text-text-muted">{description}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="surface rounded-sm border-danger/40 p-6" role="alert">
      <h2 className="font-display text-lg text-danger">Erro</h2>
      <p className="mt-2 text-sm text-text-muted">{message}</p>
    </div>
  );
}

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="surface animate-pulse rounded-sm p-8 text-center text-text-muted" role="status">
      {label}
    </div>
  );
}
