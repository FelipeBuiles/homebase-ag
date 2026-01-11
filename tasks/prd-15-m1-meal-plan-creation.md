# PRD: Meal Plan Creation (M1)

## Introduction/Overview
HomeBase should allow users to plan meals for the week to reduce daily decision fatigue and create more intentional cooking routines. This feature provides a week view, standard meal types, and flexible references to recipes or free-text meals.

## Goals
- Support a 7-day week view for meal planning.
- Provide breakfast, lunch, and dinner meal types.
- Allow planned meals to reference a recipe or free-text.
- Allow users to duplicate day or week plans.
- Allow full editing of meal plans after creation.

## User Stories
- As a household owner, I want to plan meals for the week so I can reduce daily decisions.
- As a household owner, I want to assign recipes or free-text meals so I can plan flexibly.
- As a household owner, I want to duplicate a day or week plan to save time.
- As a household owner, I want to edit meal plans so I can adjust to changes.

## Functional Requirements
1. The system must provide a week-view meal planning interface.
2. The system must support meal types: breakfast, lunch, and dinner.
3. The system must allow planned meals to reference a recipe or free-text entry.
4. The system must allow users to duplicate a day plan or a full week plan.
5. The system must allow full editing of meal plans after creation.

## Non-Goals (Out of Scope)
- Grocery list generation (handled in M2)
- Pantry-aware suggestions (handled in M3)
- Nutrition tracking

## Design Considerations (Optional)
- Week view should allow quick add/edit for each meal slot.
- Provide a clear visual distinction between recipe-linked and free-text entries.

## Technical Considerations (Optional)
- Store meal plans with references to recipe IDs and/or free-text fields.
- Ensure duplication preserves references and free-text content.

## Success Metrics
- Users can build a weekly meal plan in under 10 minutes.
- Duplication reduces planning time for repeat weeks.

## Open Questions
- Should meal plans support multiple recipes per meal slot?
- How should conflicts be displayed if a referenced recipe is deleted?
- Should free-text meals be normalized or stored as-is?
