import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.util';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Обработка событий Prisma
prisma.$on('error' as never, (e: any) => {
  logger.error('Prisma error:', e);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
