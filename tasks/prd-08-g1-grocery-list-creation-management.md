# PRD: Grocery List Creation & Management (G1)

## Introduction/Overview
HomeBase needs a reliable way to create and manage grocery lists so users can plan and execute shopping efficiently. This feature supports multiple lists, item quantities, and full list management actions with a simple, recency-based display.

## Goals
- Support multiple grocery lists.
- Require item name and quantity on list entries.
- Display items by recency.
- Allow add, remove, check off, edit, and reorder actions.

## User Stories
- As a household owner, I want multiple grocery lists so I can separate shopping contexts.
- As a household owner, I want to add quantities so I know how much to buy.
- As a household owner, I want to check off items during shopping.
- As a household owner, I want to edit or reorder items as my plan changes.

## Functional Requirements
1. The system must allow creation of multiple grocery lists.
2. The system must require item name and quantity for each list entry.
3. The system must display items ordered by recency.
4. The system must allow users to add, remove, check off, edit, and reorder items.
5. The system must allow renaming and deleting grocery lists.

## Non-Goals (Out of Scope)
- Sharing or exporting grocery lists
- AI-based grocery suggestions (handled in G2/G3)
- Store or aisle grouping

## Design Considerations (Optional)
- Use a clear completed vs incomplete visual distinction for checked items.
- Reordering should be simple (drag and drop or explicit controls).

## Technical Considerations (Optional)
- Maintain item order separate from recency metadata to avoid conflicts.
- Ensure reordering does not overwrite recency sorting rules.

## Success Metrics
- Users can create and manage multiple lists without confusion.
- Users can check off items quickly during shopping.

## Open Questions
- How should recency be defined (created time vs last edited)?
- Should completed items collapse or remain visible by default?
- Are quantities structured (number + unit) or free text?
