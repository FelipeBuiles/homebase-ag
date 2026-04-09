import { describe, it, expect } from "vitest";
import { getAttachmentKind, isSupportedAttachment } from "@/lib/attachments";

describe("attachment helpers", () => {
  it("detects attachment kind from mime type", () => {
    expect(getAttachmentKind("image/png")).toBe("photo");
    expect(getAttachmentKind("video/mp4")).toBe("video");
    expect(getAttachmentKind("application/pdf")).toBeNull();
  });

  it("flags supported attachment mime types", () => {
    expect(isSupportedAttachment("image/jpeg")).toBe(true);
    expect(isSupportedAttachment("video/webm")).toBe(true);
    expect(isSupportedAttachment("text/plain")).toBe(false);
  });
});
