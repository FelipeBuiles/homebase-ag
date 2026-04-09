import prisma from "@/lib/prisma";

export const resetDb = async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const tableNames = tables
    .map((row) => row.tablename)
    .filter((name) => name !== "_prisma_migrations");

  if (tableNames.length === 0) return;

  const truncate = tableNames.map((name) => `"${name}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${truncate} RESTART IDENTITY CASCADE;`);
};
