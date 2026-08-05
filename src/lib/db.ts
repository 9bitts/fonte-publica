import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = resolveDatabaseUrl();

  // Prisma exige env("DATABASE_URL") no schema. Sem URL real, usa placeholder
  // só para instanciar o client; as queries checam resolveDatabaseUrl() antes.
  if (!url) {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      'postgresql://fonte:fonte@127.0.0.1:5432/fonte_publica?schema=public';
    console.error(
      JSON.stringify({
        level: 'error',
        msg: 'database_url_missing',
        hint: 'Defina DATABASE_URL no serviço Railway ou vincule o plugin Postgres.',
      }),
    );
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { url: process.env.DATABASE_URL! },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
