import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("auth", () => {
  it("hashes and verifies passwords", async () => {
    const password = "test-pass-123";
    const { hash, salt } = await hashPassword(password);

    expect(hash.length).toBeGreaterThan(0);
    expect(salt.length).toBeGreaterThan(0);

    await expect(verifyPassword(password, salt, hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-pass", salt, hash)).resolves.toBe(false);
  });
});
