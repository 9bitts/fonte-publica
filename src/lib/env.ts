/**
 * Resolve a URL do Postgres antes do PrismaClient ler o schema.
 * Prefere rede privada do Railway; public URL por último.
 */
export function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_PRIVATE_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_PUBLIC_URL,
  ];

  const url = candidates.find((v) => typeof v === 'string' && v.length > 0);
  if (url) {
    // Prisma schema usa env("DATABASE_URL") — espelha o valor encontrado.
    process.env.DATABASE_URL = url;
  }
  return url;
}
