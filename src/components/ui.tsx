import Link from 'next/link';
import type { ReactNode } from 'react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg-elevated/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:py-3">
        <Link
          href="/"
          className="font-display min-h-11 shrink truncate py-2 text-lg font-semibold tracking-tight text-text no-underline sm:text-xl"
        >
          Fonte Pública
        </Link>
        <nav
          aria-label="Principal"
          className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-2"
        >
          <Link
            href="/busca"
            className="inline-flex min-h-11 items-center px-2.5 text-text-muted no-underline hover:text-text"
          >
            Busca
          </Link>
          <Link
            href="/uf/SP"
            className="inline-flex min-h-11 items-center px-2.5 text-text-muted no-underline hover:text-text"
          >
            Por UF
          </Link>
          <Link
            href="/alertas"
            className="inline-flex min-h-11 items-center px-2.5 text-text-muted no-underline hover:text-text"
          >
            RSS
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-bg-elevated pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-text-muted">
        <p>
          Fonte Pública indexa dados abertos do{' '}
          <a href="https://pncp.gov.br" rel="noopener noreferrer" target="_blank">
            PNCP
          </a>
          . Não substitui o portal oficial. Consulta pública conforme o{' '}
          <a
            href="https://pncp.gov.br/manual/pt-br/latest/index.html"
            rel="noopener noreferrer"
            target="_blank"
          >
            Manual de Integração
          </a>{' '}
          e a{' '}
          <a
            href="https://pncp.gov.br/api/consulta/swagger-ui/index.html"
            rel="noopener noreferrer"
            target="_blank"
          >
            API de Consulta
          </a>
          .
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
    <div className="flex min-h-screen min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
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
