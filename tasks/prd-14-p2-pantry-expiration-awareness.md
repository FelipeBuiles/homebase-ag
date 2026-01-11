# PRD: Pantry Expiration Awareness (P2)

## Introduction/Overview
HomeBase should help users reduce food waste by tracking expiration and opened dates for pantry items and surfacing items that are expiring soon. This feature provides multiple visibility surfaces, a user-configurable warning window, and simple status updates.

## Goals
- Track expiration date and opened date for pantry items.
- Surface expiring items in a dedicated view, in the pantry list, and via a dashboard widget.
- Provide a user-configurable warning window.
- Allow expiration to be optional with an explicit unknown state.
- Allow marking items as consumed or discarded.

## User Stories
- As a household owner, I want to track expiration and opened dates so I can prioritize usage.
- As a household owner, I want expiring items highlighted so I do not miss them.
- As a household owner, I want to configure the warning window to match my habits.
- As a household owner, I want to mark items consumed or discarded to keep the pantry accurate.

## Functional Requirements
1. The system must support expiration date and opened date fields on pantry items.
2. The system must allow expiration data to be optional with an explicit unknown state.
3. The system must provide a user-configurable warning window for expiring items.
4. The system must surface expiring items in a dedicated view, pantry list highlights, and a dashboard widget.
5. The system must allow users to mark items as consumed or discarded.

## Non-Goals (Out of Scope)
- Automatic expiration detection from receipts
- Notifications via email/SMS/push
- Recipe suggestions based on expiring items (handled in P3/M3)

## Design Considerations (Optional)
- Use color-coded status for expiring vs expired items.
- Provide quick actions in list views for consumed/discarded.

## Technical Considerations (Optional)
- Warning window should be stored in user settings.
- Expiring logic should account for opened date when available.

## Success Metrics
- Users can identify expiring items in under 10 seconds.
- Expiration tracking reduces the number of stale pantry entries.

## Open Questions
- How should opened date influence expiration calculations?
- Should consumed/discarded items be archived or removed?
- Should the expiring view include already expired items by default?
