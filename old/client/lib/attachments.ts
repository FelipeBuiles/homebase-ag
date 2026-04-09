export type AttachmentKind = "photo" | "video";

export const getAttachmentKind = (mimeType: string): AttachmentKind | null => {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  return null;
};

export const isSupportedAttachment = (mimeType: string) => Boolean(getAttachmentKind(mimeType));
