import path from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

const runMigrations = () => {
  const envPath = path.resolve(__dirname, "../.env.test");
  dotenv.config({ path: envPath, override: true });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for tests.");
  }
  if (!databaseUrl.includes("_test")) {
    throw new Error(`Tests must use a test database. Got: ${databaseUrl}`);
  }

  const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
  execFileSync("npx", ["prisma", "migrate", "deploy", "--schema", schemaPath], {
    stdio: "inherit",
    env: { ...process.env },
  });
};

export default async function setup() {
  runMigrations();
}
