# PRD: Meal Plan to Grocery Translation (M2)

## Introduction/Overview
HomeBase should translate meal plans into actionable grocery needs so planning turns into execution. This feature creates a grocery list or adds to an existing list, considers pantry availability to reduce quantities, and uses structured ingredients when available. Proposals should go through the review framework when pantry conflicts exist.

## Goals
- Allow users to create a new grocery list or add to an existing list from a meal plan.
- Prompt users when duplicates exist and allow them to choose how to handle them.
- Reduce quantities based on pantry availability.
- Prefer structured ingredients, with raw text as fallback.
- Route changes through the review framework when pantry conflicts exist.

## User Stories
- As a household owner, I want to turn my meal plan into a grocery list so I can shop easily.
- As a household owner, I want to choose how to handle duplicates so I stay in control.
- As a household owner, I want pantry items to reduce what I need to buy.
- As a household owner, I want structured ingredient data used when possible.
- As a household owner, I want review proposals when there are pantry conflicts.

## Functional Requirements
1. The system must allow users to create a new grocery list or add to an existing list from a meal plan.
2. The system must prompt users to resolve duplicate items when they already exist on the target list.
3. The system must reduce quantities based on pantry availability.
4. The system must use structured ingredients when available and fall back to raw text otherwise.
5. The system must route changes through the review framework when pantry conflicts exist.

## Non-Goals (Out of Scope)
- Automatic application without user input
- Nutrition-based adjustments
- Multi-household inventory merging

## Design Considerations (Optional)
- Provide a preview of the generated list before applying.
- Clearly show pantry-adjusted quantities and reasoning.

## Technical Considerations (Optional)
- Ingredient matching should reuse normalization rules from R3/G2.
- Pantry reduction should be traceable in proposals.

## Success Metrics
- Users can generate a grocery list from a meal plan in under 2 minutes.
- Pantry reduction reduces unnecessary grocery items.

## Open Questions
- How should partial pantry matches be handled when units differ?
- Should the system remember the user’s preferred target list?
- When duplicates are prompted, what is the default selection?
