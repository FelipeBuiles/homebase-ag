# Groceries Quick Actions Design

## Goal
Add quick actions on the groceries page for filtering and clearing items.

## Scope
- Quick actions bar at the top of `/groceries` (below header, above add form).
- Filters: status (All / Remaining / Checked) and source (All / Manual / Recipe / Agent).
- Clear actions: Clear checked, Clear all.

Out of scope:
- Persisting filters across sessions.
- Advanced query/filter UI.

## UI/UX
- Compact action bar with segmented controls or pills.
- Status filters show counts (Remaining, Checked).
- Source filters apply instantly client-side.
- Clear actions are destructive; use a simple confirm step for clear all.

## Behavior
- Filters are client-side state.
- Clear checked deletes items where `isChecked=true`.
- Clear all deletes all items in the default list.
- Revalidate `/groceries` after clear actions.

## Error Handling
- If clear actions fail, surface a simple error toast.

## Testing
- Unit test for clear actions (checked/all).
- UI test for filter state behavior (optional if noisy).
