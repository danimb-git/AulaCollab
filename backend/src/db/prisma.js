const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool =
  globalThis.__prismaPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

const adapter =
  globalThis.__prismaAdapter ?? new PrismaPg(pool);

const prisma =
  globalThis.__prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
  globalThis.__prismaPool = pool;
  globalThis.__prismaAdapter = adapter;
}

module.exports = prisma;
