import { afterEach, describe, expect, it } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

describe("resetDb", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("clears data between tests", async () => {
    await prisma.room.create({ data: { name: "Kitchen" } });
    const count = await prisma.room.count();
    expect(count).toBe(1);
    await resetDb();
    const nextCount = await prisma.room.count();
    expect(nextCount).toBe(0);
  });
});
