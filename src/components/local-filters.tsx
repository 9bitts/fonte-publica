type Props = {
  action: string;
  de?: string;
  ate?: string;
  aberto: boolean;
  hidden?: Record<string, string>;
};

export function LocalFiltersForm({ action, de, ate, aberto, hidden }: Props) {
  return (
    <form
      method="get"
      action={action}
      className="surface mt-6 flex flex-col gap-3 rounded-sm p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      {hidden
        ? Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <div className="min-w-[9rem] flex-1">
        <label htmlFor="de" className="block text-xs font-medium text-text-muted">
          Publicadas de
        </label>
        <input
          id="de"
          name="de"
          type="date"
          defaultValue={de ?? ''}
          className="mt-1 min-h-11 w-full rounded-sm border border-border bg-bg px-3 py-2 text-base sm:text-sm"
        />
      </div>
      <div className="min-w-[9rem] flex-1">
        <label htmlFor="ate" className="block text-xs font-medium text-text-muted">
          até
        </label>
        <input
          id="ate"
          name="ate"
          type="date"
          defaultValue={ate ?? ''}
          className="mt-1 min-h-11 w-full rounded-sm border border-border bg-bg px-3 py-2 text-base sm:text-sm"
        />
      </div>
      <div className="min-w-[11rem] flex-1">
        <label htmlFor="aberto" className="block text-xs font-medium text-text-muted">
          Situação das propostas
        </label>
        <select
          id="aberto"
          name="aberto"
          defaultValue={aberto ? '1' : '0'}
          className="mt-1 min-h-11 w-full rounded-sm border border-border bg-bg px-3 py-2 text-base sm:text-sm"
        >
          <option value="1">Só em aberto</option>
          <option value="0">Todas</option>
        </select>
      </div>
      <button
        type="submit"
        className="min-h-11 rounded-sm bg-accent px-4 text-sm font-medium text-bg hover:bg-accent-dim"
      >
        Filtrar
      </button>
    </form>
  );
}
