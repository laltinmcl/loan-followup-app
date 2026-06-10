import { PrismaClient as PrismaClientClass } from '@prisma/client';

let _prisma: PrismaClientClass;

function getPrisma(): PrismaClientClass {
  if (!_prisma) {
    _prisma = new PrismaClientClass({
      log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    });
  }
  return _prisma;
}

// Proxy so route files can keep using `prisma.X` syntax
const prisma = new Proxy({} as PrismaClientClass, {
  get(_, prop) {
    return getPrisma()[prop as keyof PrismaClientClass];
  },
});

export { prisma };
