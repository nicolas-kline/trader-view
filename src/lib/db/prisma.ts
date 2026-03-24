import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const isPgBouncer = connectionString.includes('pgbouncer=true');

  const adapter = new PrismaPg({
    connectionString,
    // pgbouncer in transaction mode requires no prepared statements
    ...(isPgBouncer && { prepareStatement: false }),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
