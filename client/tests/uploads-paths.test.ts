import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePublicUploadPath } from "../lib/uploads";

describe("resolvePublicUploadPath", () => {
  it("resolves uploads with a leading slash", () => {
    const root = "/app";
    const result = resolvePublicUploadPath("/uploads/inventory/file.jpg", root);

    expect(result).toBe(path.join(root, "public", "uploads", "inventory", "file.jpg"));
  });

  it("resolves uploads without a leading slash", () => {
    const root = "/app";
    const result = resolvePublicUploadPath("uploads/inventory/file.jpg", root);

    expect(result).toBe(path.join(root, "public", "uploads", "inventory", "file.jpg"));
  });

  it("returns null for non-upload paths", () => {
    const result = resolvePublicUploadPath("/avatars/user.jpg", "/app");

    expect(result).toBeNull();
  });
});
