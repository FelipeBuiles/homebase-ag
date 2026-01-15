const JSON_LD_REGEX = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
const OG_IMAGE_REGEX = /<meta[^>]+(?:property|name)=["']og:image["'][^>]*>/gi;
const ARTICLE_REGEX = /<article[^>]*>([\s\S]*?)<\/article>/i;
const IMG_REGEX = /<img[^>]*>/gi;

const resolveUrl = (value: string | null | undefined, baseUrl?: string) => {
  if (!value) return null;
  try {
    if (baseUrl) {
      return new URL(value, baseUrl).toString();
    }
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
  } catch {
    return null;
  }
  return null;
};

const isLikelyImageUrl = (value: string) => {
  try {
    const url = new URL(value);
    const extensionMatch = url.pathname.match(/\.(avif|gif|jpe?g|png|webp|svg)$/i);
    if (extensionMatch) return true;
    return false;
  } catch {
    return false;
  }
};

const extractContent = (tag: string, attr: string) => {
  const match = new RegExp(`${attr}=["']([^"']+)["']`, "i").exec(tag);
  return match?.[1] ?? null;
};

const extractDimension = (tag: string, attr: string) => {
  const match = new RegExp(`${attr}=["']?(\\d{1,4})`, "i").exec(tag);
  return match ? Number.parseInt(match[1], 10) : null;
};

const isLargeImage = (width: number | null, height: number | null) => {
  if (width && height) return width >= 200 && height >= 200;
  if (width) return width >= 400;
  if (height) return height >= 400;
  return false;
};

const extractJsonLdImage = (html: string, baseUrl?: string) => {
  const matches = html.matchAll(JSON_LD_REGEX);
  for (const match of matches) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      const image = findImageInJsonLd(data);
      const resolved = resolveUrl(image, baseUrl);
      if (resolved && isLikelyImageUrl(resolved)) return resolved;
    } catch {
      continue;
    }
  }
  return null;
};

const findImageInJsonLd = (node: unknown): string | null => {
  if (!node) return null;
  if (typeof node === "string") return node;
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findImageInJsonLd(entry);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === "object") {
    const record = node as Record<string, unknown>;
    if (record.image) {
      const found = findImageInJsonLd(record.image);
      if (found) return found;
    }
    if (record["@graph"]) {
      const found = findImageInJsonLd(record["@graph"]);
      if (found) return found;
    }
    if (record.url && typeof record.url === "string") {
      return record.url;
    }
    if (record["@id"] && typeof record["@id"] === "string") {
      return record["@id"];
    }
  }
  return null;
};

const extractOgImage = (html: string, baseUrl?: string) => {
  const matches = html.matchAll(OG_IMAGE_REGEX);
  for (const match of matches) {
    const tag = match[0];
    const content = extractContent(tag, "content");
    const resolved = resolveUrl(content, baseUrl);
    if (resolved) return resolved;
  }
  return null;
};

const extractContentImage = (html: string, baseUrl?: string) => {
  const articleMatch = ARTICLE_REGEX.exec(html);
  const searchHtml = articleMatch?.[1] ?? html;
  const matches = searchHtml.matchAll(IMG_REGEX);
  for (const match of matches) {
    const tag = match[0];
    const src = extractContent(tag, "src") ?? extractContent(tag, "data-src");
    const width = extractDimension(tag, "width") ?? extractDimension(tag, "data-width");
    const height = extractDimension(tag, "height") ?? extractDimension(tag, "data-height");
    if (!src || !isLargeImage(width, height)) continue;
    const resolved = resolveUrl(src, baseUrl);
    if (resolved) return resolved;
  }
  return null;
};

export const extractRecipeImageUrl = (html: string, baseUrl?: string) => {
  return (
    extractJsonLdImage(html, baseUrl) ||
    extractOgImage(html, baseUrl) ||
    extractContentImage(html, baseUrl)
  );
};
