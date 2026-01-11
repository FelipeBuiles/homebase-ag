# HomeBase Web Design System

HomeBase uses shadcn/ui as the UI component foundation. New pages and features in `apps/web` should use the shared components in `apps/web/src/components/ui` instead of raw HTML elements.

## Component inventory
Installed shadcn/ui components (keep using these as defaults):
- `Button`, `Badge`, `Card`, `Input`, `Textarea`
- `Checkbox`, `RadioGroup`, `Switch`
- `Select`, `Command` + `Popover` (combobox/multi-select)
- `Tabs`, `Separator`, `Alert`, `Tooltip`
- `Dialog` (modal), `Sheet` (side panel), `DropdownMenu` (row actions)
- `Table` (list views)
- `Calendar` (date inputs)
- `Sonner` (toast notifications)

## Usage guidance
- Prefer shadcn components for any new UI controls (buttons, inputs, forms, list rows).
- Use `Card` for primary content surfaces and repeated item patterns (proposal cards, activity entries, inventory tiles).
- Use `Badge` for status, tags, or completion labels (expiring, pending, done).
- Use `Dialog` for confirmation/modals and `Sheet` for detail or edit panels.
- Use `Command` + `Popover` for searchable selects and multi-selects (rooms, tags, categories).
- Use `Table` for dense list views with filters and bulk actions.
- Use `Calendar` with `Popover` for date inputs (expiration, opened dates).

## Toasts
`Sonner` is installed but not wired globally. If you add toasts, mount `<Toaster />` in `apps/web/src/app/layout.tsx` and add a theme provider if you want theme-aware styling.

## File locations
- Components: `apps/web/src/components/ui`
- Utility: `apps/web/src/lib/utils.ts` (`cn` helper)
