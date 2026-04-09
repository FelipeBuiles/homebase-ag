# Recipes → Groceries Design

## Goal
Add an explicit “Add ingredients to groceries” action on recipe list cards and recipe detail pages. The action appends ingredients into the single default grocery list with automatic merge using canonical keys.

## Scope
- UI actions on recipe list + recipe detail pages.
- Server action to add ingredients to groceries.
- Merge behavior using canonicalKey/normalizedName.

Out of scope:
- Pantry-aware filtering.
- Automatic list creation per recipe.
- Manual merge preview UI.

## Architecture
- Reuse single default grocery list.
- Add a server action (e.g., `addRecipeIngredientsToGroceries(recipeId)`) that:
  - Loads recipe + ingredients.
  - Normalizes each ingredient line to canonicalKey.
  - Merges with existing grocery items by canonicalKey.
  - Creates new grocery items (source=recipe) when no match.

## Data Flow
1. User clicks “Add ingredients to groceries.”
2. Action fetches recipe ingredients.
3. Each ingredient is normalized; canonicalKey derived.
4. If a grocery item with same canonicalKey exists, merge (record in mergedFrom or keep existing quantity).
5. Otherwise create new grocery item with `source=recipe`.
6. Revalidate `/groceries`; return summary counts.

## UI/UX
- Recipes list card: small “Add to groceries” button.
- Recipe detail page: primary button in header.
- Show success notice (e.g., “Added X, merged Y”).

## Error Handling
- If recipe has no ingredients, no-op with a friendly notice.
- If normalization fails, fallback to raw ingredient string for canonicalKey.
- Idempotent by canonicalKey merge (repeat clicks do not create duplicates).

## Testing
- Unit test for merge behavior with existing grocery item.
- Unit test for empty ingredients no-op.
- Optional UI tests for button presence on list/detail.
