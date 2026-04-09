# PRD: Recipe Storage & Organization (R1)

## Introduction/Overview
HomeBase needs a structured recipe repository so users can store, organize, and find recipes quickly. This feature supports full recipe data capture, tags and categories for organization, full-text search, and favorites.

## Goals
- Allow users to save recipes with title, ingredients, instructions, and tags.
- Support recipe organization via tags and categories.
- Enable full-text search across all recipe fields.
- Allow users to favorite recipes.
- Allow full editing of recipes after creation.

## User Stories
- As a household owner, I want to save full recipes so I can cook later without re-entering details.
- As a household owner, I want tags and categories so I can organize recipes in flexible ways.
- As a household owner, I want to search across all recipe content so I can find recipes quickly.
- As a household owner, I want to favorite recipes so I can access them faster.
- As a household owner, I want to edit recipes so my collection stays accurate.

## Functional Requirements
1. The system must require title, ingredients, instructions, and tags when creating a recipe.
2. The system must allow assigning categories to recipes.
3. The system must provide full-text search across title, ingredients, instructions, tags, and categories.
4. The system must allow users to mark recipes as favorites.
5. The system must allow editing of all recipe fields after creation.

## Non-Goals (Out of Scope)
- Recipe import from URLs (handled in R2)
- Ingredient normalization (handled in R3)
- Social sharing or public recipe discovery

## Design Considerations (Optional)
- Favorite recipes should be visually distinct in list views.
- Tags and categories should be easy to manage during editing.

## Technical Considerations (Optional)
- Full-text search should support partial matches and common misspellings.
- Tags and categories should be reusable across recipes.

## Success Metrics
- Users can save and retrieve recipes without manual scrolling.
- Search finds relevant recipes in under 2 seconds for typical collections.

## Open Questions
- What are the initial predefined categories, if any?
- Should favorites be a separate filter or a pinned list?
- How should tags/categories be managed (inline vs settings screen)?
