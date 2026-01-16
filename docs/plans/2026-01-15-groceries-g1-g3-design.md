# Groceries G1-G3 Design (Single List, Ops-Focused)

## Goal
Deliver G1–G3 for groceries with an ops focus: normalization + duplicate detection/merge, while keeping recipes integration ready and pantry-ready for future work.

## Scope
- G1: Single default grocery list (no user-created lists).
- G2: Grocery normalization agent to standardize names and set canonical keys.
- G3: List optimization UI to detect duplicates and allow manual merges.

Out of scope:
- Pantry-aware pruning or auto-removal.
- Recipe-driven list creation (only enable data fields for future use).

## Architecture
- Keep `GroceryList` and `GroceryItem` models but enforce a single default list per user.
- `GroceryItem` additions:
  - `normalizedName` (string, optional)
  - `canonicalKey` (string, optional)
  - `source` (enum: manual | recipe | agent)
  - `suggestedCategory` (string, optional)
  - `mergedFrom` (json/text, optional; stores original names/ids for transparency)
- G2 agent runs on create/update, writing normalized fields and possible duplicate hints.
- G3 optimization is on-demand from the UI and never auto-merges items.

## Data Flow
1. User adds an item in `/groceries`.
2. Item saved with raw `name`, `source=manual`.
3. Normalization job enqueued on `grocery` queue.
4. Agent writes `normalizedName` + `canonicalKey` and optional category.
5. UI shows normalized vs raw and a badge for source.
6. Optimization panel queries for duplicate candidates:
   - exact `canonicalKey` match within list
   - fuzzy match on normalizedName within list
7. User confirms merges; server action consolidates items and records `mergedFrom`.

## UI/UX
- `/groceries` shows the single list with add-item form.
- Remove list creation UI and any list picker.
- Add "Review duplicates" panel or drawer with merge previews.
- Item row shows raw name, normalized name (if different), and source badge.
- `/groceries/[id]` redirects to `/groceries`.

## Recipes Integration
- Maintain `source=recipe` as a supported value for items created from recipes later.
- Normalization applies to all sources uniformly to enable cross-source dedup.

## Error Handling
- Agent failures mark item normalization status (optional) but do not block list usage.
- Optimization merges are guarded to prevent empty names and avoid deleting all items.

## Testing
- Unit tests for merge candidate generation and merge action.
- Agent prompt and normalization result tests.
- UI tests for duplicates panel interaction.

## Notes
- No migration backfill needed; DB can be reset before rollout.
- Keep schema flexible to reintroduce multi-list later if needed.
