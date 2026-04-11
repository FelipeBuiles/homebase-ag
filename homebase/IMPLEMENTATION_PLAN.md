# HomeBase Gap Analysis — Implementation Plan

## Schema Changes (all in `prisma/schema.prisma`)

### Already applied in schema:
- **PantryItem**: `status` (in_stock/out_of_stock/consumed/discarded), `statusUpdatedAt`, `inventoryItemId` (cross-link)
- **Recipe**: `parsingError`, `parsingUpdatedAt`
- **GroceryList**: `isDefault` boolean
- **GroceryItem**: `canonicalKey`, `mergedFrom` (Json), `source` default "manual"
- **InventoryItem**: `enrichmentStatus` (pending/enriched/skipped), `pantryItems` relation
- **MealPlanItem**: `notes` field
- **AgentConfig**: `userPrompt` field

## High Priority

### 1. Pantry Status + Lifecycle (#3)
- Update `lib/db/queries/pantry.ts` — add status to create/update, filter by status
- Update `actions/pantry.ts` — add status change actions (consume, discard, mark out_of_stock)
- Update `components/pantry/pantry-row.tsx` — status badge + quick-action buttons
- Update `components/pantry/pantry-form.tsx` — status field in form
- Update `components/pantry/pantry-list-client.tsx` — status filter tabs

### 2. Agent Config UI (#14)
- Update `components/settings/agent-config-row.tsx` — add userPrompt textarea

### 3. Recipe Parsing Retry (#10)
- Update `actions/recipes.ts` — add retry action, update parseStatus/parsingError
- Update `components/recipes/recipe-detail` — retry button, error display, polling

### 4. Groceries Duplicate Detection (#12)
- Add `lib/db/queries/groceries.ts` — duplicate detection by canonicalKey, merge function
- Update `actions/groceries.ts` — detect duplicates on add, merge action
- Update grocery list detail UI — show duplicate warnings, merge button

### 5. Recipe → Groceries (#11)
- Add action to add recipe ingredients to a grocery list
- Add "Add to Groceries" button on recipe detail page

## Medium Priority

### 6. Advanced Inventory Filtering (#7)
- Update `lib/db/queries/inventory.ts` — add enrichmentStatus, hasAttachments, completeness filters
- Update `components/inventory/filter-chips.tsx` — new filter chips

### 7. Proposal Selective Change (#16)
- Update `components/review/proposal-card.tsx` — per-change reject button, applied state tracking

### 8. Pantry Expiring View (#2)
- Add `app/(app)/pantry/expiring/page.tsx` — dedicated route

### 9. Activity Metrics (#6)
- Add `app/(app)/activity/metrics/page.tsx` or extend activity page
- Use `getActivityMetrics()` already in `lib/db/queries/settings.ts`

### 10. Grocery Source Tracking (#13)
- Update grocery list UI to show source badges, filter by source

## Lower Priority

### 11-16. Remaining features
- Inventory cross-link for pantry (#4) — already in schema, add UI navigation
- Default grocery list (#20) — add set-default action, use in recipe→groceries
- Meal plan notes (#18) — already in schema, add to form/display
- Enrichment status (#9) — already in schema, add filter/display
- Grid view toggle (#8) — add grid layout option
- Organization settings (#15) — CRUD for rooms/categories/tags in settings
