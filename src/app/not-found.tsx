import { EmptyState, PageShell } from '@/components/ui';

export default function NotFound() {
  return (
    <PageShell>
      <EmptyState
        title="Página não encontrada"
        description="O recurso solicitado não existe ou ainda não foi indexado."
      />
    </PageShell>
  );
}
