# PRD: Inventory Enrichment Agent (I5)

## Introduction/Overview
HomeBase should reduce manual organization effort by providing AI-driven enrichment suggestions for inventory items. This feature enables an enrichment agent that proposes categories, locations, and tags based on item data, and provides high-confidence duplicate warnings. Suggestions are surfaced as reviewable proposals and can be triggered manually or on item creation/edit.

## Goals
- Provide an enrichment agent that suggests category, location, and tags.
- Trigger enrichment manually and on item creation/edit.
- Include high-confidence duplicate warnings in suggestions.
- Use item name, photos, and existing inventory patterns as context.
- Produce one proposal per session containing multiple items.

## User Stories
- As a household owner, I want enrichment suggestions so I can reduce manual categorization.
- As a household owner, I want suggestions to appear after adding/editing items so I can review immediately.
- As a household owner, I want to run enrichment manually when I choose.
- As a household owner, I want duplicate warnings only when confidence is high.
- As a household owner, I want proposals grouped per session so I can review changes efficiently.

## Functional Requirements
1. The system must provide an inventory enrichment agent that suggests category, location, and tags.
2. The system must support manual triggers for enrichment.
3. The system must run enrichment on item creation/edit events.
4. The system must generate high-confidence duplicate warnings when detected.
5. The system must use item name, photos, and existing inventory patterns as context.
6. The system must create one proposal per session containing multiple item suggestions.
7. The system must route all proposals through the human-in-the-loop review framework.

## Non-Goals (Out of Scope)
- Automatic application of suggestions
- Low-confidence duplicate detection
- Batch scheduled runs (not in MVP)

## Design Considerations (Optional)
- Provide clear confidence indicators for each suggestion.
- Group suggestions by item within the proposal for readability.

## Technical Considerations (Optional)
- Enrichment logic should be isolated to allow future model swaps.
- Duplicate warnings should include the matching fields and similarity score.

## Success Metrics
- Users accept a meaningful portion of suggestions (e.g., >40%).
- Manual enrichment runs complete without blocking the UI.
- High-confidence duplicate warnings reduce redundant entries.

## Open Questions
- What confidence threshold should be considered “high” for duplicates?
- Should enrichment re-run on every edit, or only on specific fields?
- How should photo context be handled if uploads are pending?
