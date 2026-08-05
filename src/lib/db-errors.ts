/**
 * Mensagens amigáveis para falhas de banco (Railway sem migrate, etc.).
 */
export function dbErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  if (/Environment variable not found: DATABASE_URL|database_url_missing|não configurado/i.test(raw)) {
    return 'Banco de dados não configurado. Defina DATABASE_URL no Railway (Variables → Postgres).';
  }

  if (
    /does not exist in the current database|P2021|relation .* does not exist/i.test(raw)
  ) {
    return 'O banco ainda não tem as tabelas. O deploy deve rodar `npm run db:deploy` (migrate) na subida do app — faça um redeploy após o último push.';
  }

  if (/Can't reach database|P1001|ECONNREFUSED|timed out/i.test(raw)) {
    return 'Não foi possível conectar ao Postgres. Confira DATABASE_URL e se o plugin Postgres está no ar.';
  }

  return raw;
}
