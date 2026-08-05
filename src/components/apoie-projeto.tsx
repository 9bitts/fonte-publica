const PAYPAL_URL = 'https://www.paypal.com/paypalme/DiegoAlbsPassos';

export function ApoieProjeto() {
  return (
    <div className="surface max-w-xl rounded-sm border border-border bg-bg-elevated p-6 sm:p-8">
      <h2 id="apoie-projeto" className="font-display text-2xl font-semibold italic text-text">
        Mantenha a fonte viva
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
        A Fonte Pública é gratuita e sem cadastro. Se o radar de licitações te ajuda no dia a dia e
        você puder contribuir, qualquer valor fortalece a manutenção do projeto.
      </p>
      <p className="mt-6">
        <a
          href={PAYPAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-medium text-bg no-underline hover:bg-accent-dim"
        >
          Apoiar o projeto
        </a>
      </p>
      <p className="mt-3 text-xs text-text-muted">Qualquer valor. Seguro via PayPal. Obrigado.</p>
    </div>
  );
}
