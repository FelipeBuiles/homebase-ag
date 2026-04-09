# PRD: Recipe Ingredient Structuring (R3)

## Introduction/Overview
HomeBase should convert recipe ingredients into structured, comparable data so they can integrate with groceries and pantry workflows. This feature supports both manual entry and AI parsing, stores raw text alongside structured fields, and allows full editing.

## Goals
- Capture ingredient name, quantity, unit, and notes.
- Support both manual entry and AI parsing from free-text lines.
- Normalize ingredient names and units during structuring.
- Store structured fields alongside original raw text.
- Allow full editing of structured ingredients.

## User Stories
- As a household owner, I want ingredients structured so recipes connect to pantry and grocery data.
- As a household owner, I want AI parsing so I don’t have to structure every line manually.
- As a household owner, I want to edit structured fields so I can correct parsing errors.
- As a household owner, I want raw text preserved so I can reference the original recipe.

## Functional Requirements
1. The system must support ingredient fields: name, quantity, unit, and notes.
2. The system must allow manual entry of structured ingredients.
3. The system must support AI parsing from free-text ingredient lines.
4. The system must normalize ingredient names and units during structuring.
5. The system must store original raw text alongside structured fields.
6. The system must allow full editing of structured ingredients after parsing.

## Non-Goals (Out of Scope)
- Nutrition analysis
- Automatic substitution suggestions
- Pantry auto-deduction

## Design Considerations (Optional)
- Show raw text next to structured fields for easy verification.
- Use inline editing for quick corrections.

## Technical Considerations (Optional)
- Parsing should handle common fraction formats and ranges.
- Normalization rules should be consistent with grocery and pantry normalization.

## Success Metrics
- Users can structure a recipe’s ingredients in under 2 minutes.
- AI parsing produces usable structured fields for most common recipes.

## Open Questions
- What normalization rules should be shared across domains?
- Should notes support multiple tags (e.g., “chopped,” “fresh,” “optional”)?
- How should ranges (e.g., “1–2 tbsp”) be stored?
