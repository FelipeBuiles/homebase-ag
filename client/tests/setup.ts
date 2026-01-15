import path from "node:path";
import dotenv from "dotenv";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

const envPath = path.resolve(__dirname, "../.env.test");
dotenv.config({ path: envPath });

afterEach(() => {
  cleanup();
});
