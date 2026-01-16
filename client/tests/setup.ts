import path from "node:path";
import dotenv from "dotenv";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

const envPath = path.resolve(__dirname, "../.env.test");
dotenv.config({ path: envPath, quiet: true, override: true });
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests.");
}
if (!process.env.DATABASE_URL.includes("_test")) {
  throw new Error(`Tests must use a test database. Got: ${process.env.DATABASE_URL}`);
}

afterEach(() => {
  cleanup();
});
