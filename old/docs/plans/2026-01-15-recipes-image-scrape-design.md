# Recipes: scraped images design

## Goals
- Automatically populate `recipe.imageUrl` when a recipe is imported from a URL.
- Prefer structured metadata (JSON-LD, OpenGraph) and fall back to a sensible content image.
- Show images on recipe cards and recipe detail headers with a consistent, minimal UI treatment.

## Non-goals
- Manual image uploads or editing.
- Image proxying, caching, or transformations.
- Changing parsing behavior beyond adding image extraction.

## Architecture
- Extend the recipe parser agent to extract an image URL from the raw HTML before it is stripped.
- Extract order:
  1. JSON-LD `image` (schema.org)
  2. `og:image` (OpenGraph)
  3. First large `<img>` within article content
- Normalize to an absolute URL and drop invalid/empty values.
- Include `imageUrl` in the parsed payload applied by `applyParsedRecipe`.
- Respect user edits: only overwrite `imageUrl` if it is empty.

## UI/UX
- Recipe cards: left-aligned thumbnail (64–72px square) with consistent border radius and neutral placeholder when missing.
- Recipe detail: shallow hero image above description and editor, same surface treatment as cards.
- Parsed updates appear via existing polling refresh once parsing completes.

## Error handling
- If no valid image is found, leave `imageUrl` null.
- Ignore relative or malformed URLs.
- Fallback `<img>` must meet a minimal size threshold to avoid tracking pixels.

## Testing
- Unit tests for image extraction logic covering JSON-LD, OpenGraph, and fallback `<img>`.
- Parser tests ensure `applyParsedRecipe` accepts and persists `imageUrl`.
- UI tests for list cards and detail header showing image vs placeholder.

## Open questions
- Threshold for fallback image size (e.g., min width/height or heuristic based on attributes).
