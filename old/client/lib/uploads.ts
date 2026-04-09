import path from "node:path";

const normalizeUploadPath = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (!normalized.startsWith("/uploads/")) return null;
  return normalized.slice(1);
};

export const resolvePublicUploadPath = (url: string, root = process.cwd()) => {
  const normalized = normalizeUploadPath(url);
  if (!normalized) return null;
  return path.join(root, "public", normalized);
};
