# PRD: Pantry Item Tracking (P1)

## Introduction/Overview
HomeBase needs pantry tracking so users can see what food is available at home. This feature supports full pantry item data, optional links to inventory items, explicit in-stock status, and category-based grouping.

## Goals
- Track pantry items with name, quantity, unit, and location.
- Allow optional linking to inventory items.
- Support full editing of pantry item fields.
- Provide explicit in-stock vs out-of-stock status.
- Display pantry items grouped by category.

## User Stories
- As a household owner, I want to track pantry items so I can avoid overbuying.
- As a household owner, I want to link pantry items to inventory when relevant.
- As a household owner, I want to update all pantry item fields as things change.
- As a household owner, I want to mark items out of stock to keep lists accurate.
- As a household owner, I want pantry items grouped by category for easy scanning.

## Functional Requirements
1. The system must require pantry item name, quantity, unit, and location.
2. The system must allow optional linking of pantry items to inventory items.
3. The system must allow full editing of pantry item fields.
4. The system must support explicit in-stock/out-of-stock status.
5. The system must display pantry items grouped by category by default.

## Non-Goals (Out of Scope)
- Expiration tracking (handled in P2)
- Pantry maintenance suggestions (handled in P3)
- Auto-deduction from recipes

## Design Considerations (Optional)
- Use clear visual indicators for in-stock vs out-of-stock items.
- Allow grouping collapse/expand by category.

## Technical Considerations (Optional)
- Consider syncing category choices with inventory categories.
- Ensure inventory links do not enforce deletion cascades.

## Success Metrics
- Users can update pantry status in under 10 seconds per item.
- Grouped view makes scanning pantry faster than a flat list.

## Open Questions
- Should location be required if category is present?
- How should inventory links be shown in the pantry UI?
- Should out-of-stock items be hidden by default?
