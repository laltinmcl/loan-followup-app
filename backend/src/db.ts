// Lazy import to avoid EROFS on Vercel serverless
let PrismaClientClass: any;
let _prisma: any;

function getPrisma() {
  if (!_prisma) {
    PrismaClientClass = require('@prisma/client').PrismaClient;
    _prisma = new PrismaClientClass({
      log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    });
  }
  return _prisma;
}

const prisma = new Proxy({} as any, {
  get(_, prop) {
    return getPrisma()[prop];
  },
});

export { prisma };
