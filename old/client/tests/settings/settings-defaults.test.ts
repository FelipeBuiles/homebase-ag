import { afterEach, beforeEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";
import { getAppConfig } from "@/lib/settings";

const ORIGINAL_ENV = { ...process.env };

describe("app config defaults", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    await resetDb();
  });

  afterEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    await resetDb();
  });

  it("uses env defaults when config is missing", async () => {
    process.env.DEFAULT_PROVIDER = "openai";
    process.env.DEFAULT_API_KEY = "sk-test";
    process.env.DEFAULT_TEXT_MODEL = "gpt-4.1-mini";
    process.env.DEFAULT_VISION_MODEL = "gpt-4.1-mini";

    const config = await getAppConfig();

    expect(config?.llmProvider).toBe("openai");
    expect(config?.llmApiKey).toBe("sk-test");
    expect(config?.llmModel).toBe("gpt-4.1-mini");
    expect(config?.llmVisionModel).toBe("gpt-4.1-mini");
    expect(config?.setupComplete).toBe(false);
  });

  it("does not override existing config", async () => {
    await prisma.appConfig.create({
      data: {
        id: "app",
        setupComplete: true,
        llmProvider: "ollama",
      },
    });

    process.env.DEFAULT_PROVIDER = "openai";

    const config = await getAppConfig();

    expect(config?.llmProvider).toBe("ollama");
  });
});
