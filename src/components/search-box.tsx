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
      <div className="flex gap-2">
        <input
          id="q"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex.: software, merenda, obra rodoviária…"
          className={`w-full rounded-sm border border-border bg-bg px-3 text-text placeholder:text-text-muted ${
            large ? 'py-3 text-base' : 'py-2 text-sm'
          }`}
          autoComplete="off"
        />
        <button
          type="submit"
          className={`rounded-sm bg-accent px-4 font-medium text-bg hover:bg-accent-dim ${
            large ? 'py-3' : 'py-2'
          }`}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
