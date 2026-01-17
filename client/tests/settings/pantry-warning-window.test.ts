import { afterEach, beforeEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";
import { getAppConfig } from "@/lib/settings";

const ORIGINAL_ENV = { ...process.env };

describe("pantry warning window defaults", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    await resetDb();
  });

  afterEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    await resetDb();
  });

  it("sets default warning days when config is missing", async () => {
    const config = await getAppConfig();
    expect((config as Record<string, unknown>).pantryWarningDays).toBe(7);
  });

  it("does not override existing warning window", async () => {
    await prisma.appConfig.create({
      data: { id: "app", pantryWarningDays: 3 },
    });

    const config = await getAppConfig();
    expect((config as Record<string, unknown>).pantryWarningDays).toBe(3);
  });
});
