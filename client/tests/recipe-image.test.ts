import { describe, expect, it } from "vitest";
import { extractRecipeImageUrl } from "../lib/recipe-image";

describe("extractRecipeImageUrl", () => {
  it("prefers JSON-LD image over og:image", () => {
    const html = `
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "Recipe",
        "image": "https://example.com/schema.jpg"
      }</script>
      <meta property="og:image" content="https://example.com/og.jpg" />
    `;

    expect(extractRecipeImageUrl(html, "https://example.com"))
      .toBe("https://example.com/schema.jpg");
  });

  it("falls back to og:image when JSON-LD missing", () => {
    const html = `<meta property="og:image" content="https://example.com/og.jpg" />`;

    expect(extractRecipeImageUrl(html, "https://example.com"))
      .toBe("https://example.com/og.jpg");
  });

  it("uses the first large content image when metadata missing", () => {
    const html = `
      <article>
        <img src="https://example.com/small.jpg" width="10" height="10" />
        <img src="/images/hero.jpg" width="900" height="600" />
      </article>
    `;

    expect(extractRecipeImageUrl(html, "https://example.com/recipes/1"))
      .toBe("https://example.com/images/hero.jpg");
  });

  it("ignores JSON-LD image anchors and falls back to og:image", () => {
    const html = `
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            "image": { "@id": "https://example.com/recipe#primaryimage" }
          },
          {
            "@type": "ImageObject",
            "@id": "https://example.com/recipe#primaryimage"
          }
        ]
      }</script>
      <meta property="og:image" content="https://example.com/og.jpg" />
    `;

    expect(extractRecipeImageUrl(html, "https://example.com/recipe"))
      .toBe("https://example.com/og.jpg");
  });

  it("prefers og:image when JSON-LD image lacks file extension", () => {
    const html = `
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "Recipe",
        "image": "https://example.com/recipe/image"
      }</script>
      <meta property="og:image" content="https://example.com/og.jpg" />
    `;

    expect(extractRecipeImageUrl(html, "https://example.com/recipe"))
      .toBe("https://example.com/og.jpg");
  });
});
