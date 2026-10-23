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

const IDLE_MS = 20_000;
const SKIP = new Set(['$disconnect', '$connect', '$on', '$extends', '$use']);

let inflight = 0;
let idleTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleIdleDisconnect(client: PrismaClient) {
  if (process.env.NODE_ENV !== 'production') return;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (inflight === 0) void client.$disconnect();
  }, IDLE_MS);
}

function isWakeError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /P1001|P1017|ECONNREFUSED|ETIMEDOUT|Can't reach database|Server has closed the connection|Connection terminated|timeout/i.test(
    msg,
  );
}

function isPromise(value: unknown): value is Promise<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

function track(client: PrismaClient, run: () => unknown): unknown {
  inflight += 1;
  if (idleTimer) clearTimeout(idleTimer);
  const finish = () => {
    inflight = Math.max(0, inflight - 1);
    if (inflight === 0) scheduleIdleDisconnect(client);
  };
  try {
    const result = run();
    if (!isPromise(result)) {
      finish();
      return result;
    }
    return result
      .then(
        (value) => value,
        async (err: unknown) => {
          if (process.env.NODE_ENV === 'production' && isWakeError(err)) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return run();
          }
          throw err;
        },
      )
      .finally(finish);
  } catch (err) {
    finish();
    throw err;
  }
}

function wrap(client: PrismaClient, target: object, depth: number): object {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (typeof prop === 'string' && SKIP.has(prop)) {
        return Reflect.get(obj, prop, receiver);
      }
      const value = Reflect.get(obj, prop, receiver);
      if (typeof value === 'function') {
        return (...args: unknown[]) => track(client, () => value.apply(obj, args));
      }
      if (value && typeof value === 'object' && depth < 2) {
        return wrap(client, value as object, depth + 1);
      }
      return value;
    },
  });
}

function createTrackedClient(): PrismaClient {
  const client = createClient();
  return wrap(client, client, 0) as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createTrackedClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
