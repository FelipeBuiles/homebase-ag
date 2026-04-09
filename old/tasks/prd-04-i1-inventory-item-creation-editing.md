# PRD: Inventory Item Creation & Editing (I1)

## Introduction/Overview
HomeBase needs a reliable way for the household owner to create and edit inventory items so the system can become a source of truth for possessions. This feature focuses on capturing the essential metadata with clear completeness rules, while keeping photo attachments out of scope for this slice.

## Goals
- Allow users to create inventory items with required metadata (name, category, location).
- Allow users to edit all fields except system/ID fields.
- Support both quick-add and full-form creation flows.
- Treat items as complete when category/location are provided or explicitly marked unknown/uncategorized.

## User Stories
- As a household owner, I want to add an inventory item quickly so I can capture items without friction.
- As a household owner, I want a full form so I can enter details when I have time.
- As a household owner, I want to edit item details so the inventory stays accurate.
- As a household owner, I want clear completeness rules so I know when an item is done.

## Functional Requirements
1. The system must require name, category, and location when creating an item.
2. The system must allow users to mark category as “uncategorized” and location as “unknown.”
3. The system must provide a quick-add flow for minimal entry.
4. The system must provide a full-form flow for detailed entry.
5. The system must allow editing of all non-system fields after creation.
6. The system must display item completeness status based on required fields or explicit unknown/uncategorized markers.

## Non-Goals (Out of Scope)
- Photo attachments or media uploads (handled in I4)
- AI enrichment or suggestions (handled in I5)
- Duplicate detection (handled in I6)

## Design Considerations (Optional)
- Quick-add should default to the minimal required fields with an easy path to the full form.
- Use clear labels or badges for “uncategorized” and “unknown.”

## Technical Considerations (Optional)
- Keep field validation consistent between quick-add and full-form flows.
- Ensure edits do not allow changes to system identifiers.

## Success Metrics
- Users can create an item and reach a “complete” state without confusion.
- Most items created via quick-add can be edited later without data loss.

## Open Questions
- What are the minimal non-system fields beyond name/category/location (e.g., notes)?
- Should quick-add default to “uncategorized/unknown” or require explicit selection?
- How should completeness be surfaced in the UI (badge, checklist, status label)?
