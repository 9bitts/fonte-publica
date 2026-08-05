'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function SearchBox({
  initialQ = '',
  large = false,
  action = '/busca',
}: {
  initialQ?: string;
  large?: boolean;
  action?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    router.push(`${action}?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full" role="search">
      <label htmlFor="q" className="sr-only">
        Buscar contratações
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="q"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex.: software, merenda, obra rodoviária…"
          enterKeyHint="search"
          className={`min-h-11 w-full rounded-sm border border-border bg-bg px-3 text-base text-text placeholder:text-text-muted sm:text-sm ${
            large ? 'sm:py-3 sm:text-base' : 'py-2.5'
          }`}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button
          type="submit"
          className={`min-h-11 shrink-0 rounded-sm bg-accent px-4 text-base font-medium text-bg hover:bg-accent-dim sm:text-sm ${
            large ? 'sm:py-3' : 'py-2.5'
          }`}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
