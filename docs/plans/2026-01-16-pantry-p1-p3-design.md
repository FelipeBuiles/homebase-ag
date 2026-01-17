# Pantry P1–P3 Agent-First + UI Integration Design

## Context
This design covers Pantry slices P1 (item tracking), P2 (expiration awareness), and P3 (maintenance agent) with an agent-first implementation that immediately updates UI surfaces to match. Cross-communication is required between Pantry ↔ Groceries, Pantry ↔ Meal Plans, and Pantry ↔ Inventory.

## Goals
- Support pantry item tracking with unified status and required fields.
- Add expiration awareness with warning window, dedicated expiring view, and highlights in the pantry list.
- Implement a pantry maintenance agent with manual + scheduled runs.
- Wire cross-communication to groceries, meal plans, and inventory.
- Keep UI aligned with the new data model and agent outputs.

## Non-Goals
- Notifications (email/SMS/push).
- Automatic application of agent proposals.
- Per-category warning windows.

## Data Model Updates
Extend `PantryItem` with:
- `status`: string enum (`in_stock`, `out_of_stock`, `consumed`, `discarded`).
- `openedDate`: nullable DateTime.
- `location`: string (required).
- `inventoryItemId`: optional FK to InventoryItem (if model exists).
- `statusUpdatedAt`: DateTime for maintenance logic.

Keep `expirationDate` nullable and treat null as explicit “unknown”.

Add global settings storage:
- `pantryWarningDays`: integer, default 7.

## UI Surfaces
### Pantry List (`/pantry`)
- Category-grouped list with collapsible sections.
- Item row: name, quantity/unit (mono), status chip, expiration/opened dates, optional inventory link.
- Hover actions: mark status (`out_of_stock`, `consumed`, `discarded`), edit, delete.
- Expiration highlights: subtle left border + status chip for expiring items; expired items get a muted destructive tag.
- Header summary: total, expiring soon, expired.

### Expiring View (`/pantry/expiring`)
- Lists items within warning window and expired; toggle to include/exclude expired.
- Shows “days left” or “expired X days ago” in mono.
- Action to request grocery proposal if none exists.

### Pantry Settings
- Simple card or modal accessible from Pantry header.
- Single control: warning window days (global).

## Agents & Cross-Communication
### Expiration Agent (P2)
- Reads `pantryWarningDays`, filters `status=in_stock`.
- Computes effective expiry using `openedDate` if available, otherwise `expirationDate`.
- Creates grocery proposals for expiring items and includes rationale with dates and warning window.

### Maintenance Agent (P3)
- Manual trigger + scheduled run.
- Rules:
  - Stale items (no updates in N days).
  - Missing required fields (location/category).
  - Potential duplicates by name + category.
  - Items `out_of_stock` for long duration.
- Generates proposals for status changes and merge suggestions; all routed through review framework.

### Chef Agent
- Uses expiring items filtered by `status=in_stock` to suggest meal plan slots.

### Pantry ↔ Inventory
- Optional link via `inventoryItemId` shown as a chip with deep link.

### Pantry ↔ Groceries
- Expiration agent proposals create grocery items with “from pantry” tag.

## Error Handling
- Default warning window to 7 days if missing.
- Skip expiration logic for items with unknown dates unless user toggles “include unknown”.

## Testing
- Unit tests for expiration calculation and warning window logic.
- Agent tests to ensure proposals created with correct filters and rationale.
- UI tests for expiring view and status actions (smoke level).

## Open Questions
- Should `openedDate` adjust expiry via a specific rule, or remain informational for now?
- Where should pantry settings live if no global settings surface exists today?
