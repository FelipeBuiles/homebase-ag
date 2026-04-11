# Connected Household Roadmap

## Product Thesis

HomeBase should feel like one operating system for the household food loop:

- `Inventory` stores household context and durable items
- `Pantry` reflects consumable food state
- `Recipes` represent possible uses of pantry
- `Meal Plans` represent chosen uses this week
- `Groceries` represent the gap after pantry and plans are compared
- `Review` captures proposed changes in context, with an inbox as fallback

Today the product is organized by data buckets. The next phase should organize the experience around decisions:

- What do I already have?
- What should I use first?
- What can I cook now?
- What do I need to buy for the week?

## Main Problems

1. Pantry is useful as a tracker but weak as a decision surface.
2. Recipes and meal plans do not visibly consume pantry.
3. Groceries behaves like a separate list tool instead of the output of planning.
4. Inventory and pantry have a valid distinction, but the UI does not teach it clearly.
5. Review is global, but most proposal value is local to feature pages.

## Roadmap

### Phase 1: Clarify The Model

Goal: make feature roles obvious before deeper workflow changes.

- Add feature copy that explains role and relationship to adjacent sections.
- Tighten empty states and page headers so they guide the next action.
- Add “related actions” and “related entities” blocks on detail pages.
- Normalize naming around pantry as the operational food layer.

### Phase 2: Pantry To Recipes

Goal: make pantry useful beyond tracking freshness.

- Add pantry coverage computation for recipes.
- Add recipe badges: `cook now`, `x/y on hand`, `uses expiring`.
- Add recipe detail coverage card.
- Add pantry page `Cook From Pantry` suggestions.
- Add missing-only grocery export from recipes.

This phase is the first implementation slice and should create the strongest “click”.

### Phase 3: Meal Plans To Groceries

Goal: make meal plans produce actionable shopping outcomes.

- Show pantry fit when picking recipes for a plan.
- Compute weekly shortages from the meal plan.
- Export only missing ingredients to groceries.
- Show provenance on grocery items from recipes and meal plans.

### Phase 4: Contextual Review

Goal: make the AI/review layer feel embedded instead of detached.

- Show local proposal banners on pantry, groceries, recipes, and meal plans.
- Keep the review inbox for batch work and overflow.
- Connect proposal rationale directly to the user’s current workflow.

## Slice A: Cook From Pantry

### Outcome

Answer one question well:

`What can I cook right now, and what am I missing?`

### User Stories

- As a user, I want to see recipes I can make from what I already have.
- As a user, I want recipes that help me use expiring items first.
- As a user, I want to know what I am missing before choosing a recipe.
- As a user, I want one click to send only missing ingredients to groceries.

### Scope

- Shared pantry coverage service
- Recipe list coverage badges
- Recipe detail pantry coverage panel
- Pantry page recipe suggestions
- Missing-only grocery export from recipe detail

### Non-goals

- Quantity-aware sufficiency
- Unit conversion
- Automatic pantry depletion after cooking
- Deep synonym/substitution matching
- Embedded review changes

## Sequencing

1. Build pantry coverage computation.
2. Use the same coverage model in recipe detail.
3. Add missing-only grocery export.
4. Surface coverage in recipe lists.
5. Add pantry suggestion sections.
6. Later, reuse the same model in meal plans and dashboard decisions.

## Product Rules

- Pantry should be the decision hub for food, not only a ledger.
- Recipes should show pantry fit before the user commits.
- Groceries should be generated from gaps whenever possible.
- Review should appear in feature context before it appears in the global inbox.
- Dashboard should prioritize “what to do next” over raw counts.
