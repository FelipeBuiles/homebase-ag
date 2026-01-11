# PRD: Grocery Item Normalization Agent (G2)

## Introduction/Overview
HomeBase should keep grocery lists clean and consistent by normalizing item names, categories, and quantity units. This feature introduces a normalization agent that proposes cleanups and duplicate merges across grocery, pantry, and recipe contexts, grouped into a single proposal per session across lists.

## Goals
- Normalize grocery item names, categories, and quantity units.
- Trigger normalization manually and on item add/edit.
- Suggest duplicate merges when appropriate.
- Use grocery, pantry, recipe, and user-defined synonyms for context.
- Produce one proposal per session across lists.

## User Stories
- As a household owner, I want grocery names standardized so my lists are clean.
- As a household owner, I want quantities normalized so I can compare items easily.
- As a household owner, I want duplicate merge suggestions to reduce list clutter.
- As a household owner, I want normalization to consider pantry and recipes so naming stays consistent.
- As a household owner, I want one grouped proposal per session so I can review efficiently.

## Functional Requirements
1. The system must provide a grocery normalization agent that suggests normalized names, categories, and quantity units.
2. The system must support manual triggers for normalization.
3. The system must run normalization on grocery item add/edit events.
4. The system must suggest merge proposals for duplicate grocery items.
5. The system must use grocery lists, pantry items, recipe ingredients, and user-defined synonyms as context.
6. The system must create one proposal per session across lists.
7. The system must route all proposals through the human-in-the-loop review framework.

## Non-Goals (Out of Scope)
- Automatic application of normalization or merges
- Scheduled batch normalization
- Nutrition or pricing normalization

## Design Considerations (Optional)
- Clearly show before/after values for names, categories, and units.
- Distinguish normalization changes from merge suggestions in the proposal UI.

## Technical Considerations (Optional)
- Maintain a synonym mapping structure for user-defined synonyms.
- Ensure merges are reversible through the review framework.

## Success Metrics
- Reduction in duplicate or inconsistent grocery item names.
- Users accept a meaningful portion of normalization proposals (e.g., >40%).

## Open Questions
- What unit normalization rules should be used (e.g., lb vs lbs)?
- How should merges handle quantities (sum vs preserve separate)?
- Should normalization respect user overrides from previous decisions?
