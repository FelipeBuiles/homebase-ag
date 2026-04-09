# Visual System

## Design principles

1. **Density over decoration** — information-rich layouts, minimal chrome
2. **Consistent surfaces** — three surface levels: page, card, inset
3. **Agent actions are visually distinct** — proposals and AI content have their own treatment
4. **Mobile-aware but desktop-first** — stacked layouts on small screens, sidebar + main on desktop

---

## Color tokens

Define all tokens in `src/app/globals.css` as CSS custom properties inside `@layer base`. Tailwind v4 picks these up via the `@theme` directive.

```css
@theme {
  /* Neutral scale (base for all surfaces) */
  --color-base-50:  #fafaf9;
  --color-base-100: #f5f5f4;
  --color-base-200: #e7e5e4;
  --color-base-300: #d6d3d1;
  --color-base-400: #a8a29e;
  --color-base-500: #78716c;
  --color-base-600: #57534e;
  --color-base-700: #44403c;
  --color-base-800: #292524;
  --color-base-900: #1c1917;
  --color-base-950: #0c0a09;

  /* Accent — used for interactive highlights, active states */
  --color-accent-400: #a78bfa;   /* violet-400 */
  --color-accent-500: #8b5cf6;   /* violet-500 */
  --color-accent-600: #7c3aed;   /* violet-600 */

  /* Semantic */
  --color-success: #4ade80;
  --color-warning: #fb923c;
  --color-danger:  #f87171;
  --color-info:    #60a5fa;

  /* Agent/AI surface — amber tint, clearly not a regular UI surface */
  --color-agent-bg:     #fffbeb;
  --color-agent-border: #fde68a;
  --color-agent-text:   #92400e;
}
```

### Surface mapping

| Surface | Background | Border |
|---------|-----------|--------|
| Page | `base-50` (light) / `base-950` (dark) | — |
| Card | `white` / `base-900` | `base-200` / `base-700` |
| Inset (inside card) | `base-50` / `base-800` | `base-200` / `base-700` |
| Agent proposal | `agent-bg` | `agent-border` |

Only implement light mode for now. Add dark mode tokens in a later pass.

---

## Typography

```css
@theme {
  --font-sans:    'DM Sans', system-ui, sans-serif;
  --font-display: 'Fraunces', Georgia, serif;
}
```

### Scale (use Tailwind classes directly)

| Role | Class | Use |
|------|-------|-----|
| Page title | `font-display text-2xl font-semibold` | H1 per page, once |
| Section heading | `text-sm font-semibold text-base-500 uppercase tracking-wide` | Group labels |
| Body | `text-sm text-base-800` | Default text |
| Secondary | `text-sm text-base-500` | Metadata, subtitles |
| Micro | `text-xs text-base-400` | Timestamps, counts |
| Code/mono | `font-mono text-sm` | IDs, quantities |

---

## Spacing & layout

Use a strict 4px base unit (Tailwind default). Prefer `gap-*` in flex/grid over individual margins.

| Context | Value |
|---------|-------|
| Page horizontal padding | `px-6` (24px) |
| Page vertical padding | `py-8` (32px) |
| Card padding | `p-4` (16px) |
| Section gap (stacked cards) | `space-y-3` |
| Inline item gap | `gap-2` |
| Form field gap | `gap-4` |

---

## Component patterns

### Page shell

Every page uses a consistent shell. Create `src/components/layout/page.tsx`:

```
<PageShell title="Inventory" action={<Button>Add item</Button>}>
  {children}
</PageShell>
```

Renders: page title (display font) left-aligned + optional right-side action button.

### List item

All list rows (inventory items, recipes, pantry entries, etc.) follow this structure:

```
[icon or thumbnail] [primary label]  [secondary meta]  [status badge]  [action menu]
```

- Fixed height: `h-14` (56px)
- Separator between rows: `divide-y divide-base-100`
- Hover: `hover:bg-base-50`
- Clickable rows navigate to detail page

### Detail page

Two-column on desktop (`grid-cols-[1fr_320px]`), stacked on mobile:
- Left: main content (title, description, primary fields, long-form content)
- Right: metadata sidebar (status, dates, actions, related items)

### Empty state

Every list/table must have an explicit empty state:

```
<EmptyState
  icon={<PackageIcon />}
  heading="No items yet"
  description="Add your first item to get started."
  action={<Button>Add item</Button>}
/>
```

### Loading state

Use skeleton placeholders matching the shape of the content (not a spinner). Each list page gets a matching `loading.tsx` file.

### Error state

Inline error banners, not modals. Use the `Alert` component with `variant="destructive"`.

---

## Agent/proposal UI

Proposals from AI agents get a distinct amber-tinted treatment so users always know they're reviewing AI-generated content.

```
┌─ amber border ──────────────────────────────────────────┐
│ ✦ Agent suggestion                    Confidence: 87%    │
│                                                           │
│  [Before → After diff or field list]                      │
│                                                           │
│  "Reason the agent gives in plain language"               │
│                                                           │
│                        [Reject]  [Accept]                 │
└───────────────────────────────────────────────────────────┘
```

- Background: `agent-bg` (`#fffbeb`)
- Border: `agent-border` (`#fde68a`)
- The sparkle icon (`✦` or `Sparkles` from Lucide) is the consistent visual marker for anything AI-generated
- Confidence is shown as a percentage, not a progress bar
- Rationale text is italicized, capped at 3 lines with expand option

---

## Navigation

Sticky top nav bar. Horizontal links, no sidebar.

```
HomeBase    Home  Inventory  Groceries  Pantry  Recipes  Meal Plans    [Review (3)]  [Settings]
```

- Active link: `text-accent-600 font-medium`
- Default link: `text-base-600 hover:text-base-900`
- Review badge shows pending proposal count — amber dot when non-zero
- On mobile: collapse to hamburger menu with drawer

---

## Status badges

Use a single `<Badge>` component with semantic `variant` props:

| Variant | Color | Use cases |
|---------|-------|-----------|
| `default` | base-700 bg | General labels |
| `success` | green | In stock, complete, accepted |
| `warning` | amber | Expiring soon, low stock, pending |
| `danger` | red | Expired, critical, rejected |
| `info` | blue | Imported, synced |
| `agent` | amber/italic | AI-sourced field values |

---

## Icons

Use Lucide React exclusively. One icon = one concept, used consistently:

| Concept | Icon |
|---------|------|
| Inventory item | `Package` |
| Recipe | `ChefHat` |
| Pantry | `Archive` |
| Grocery list | `ShoppingCart` |
| Meal plan | `CalendarDays` |
| Agent/AI | `Sparkles` |
| Review/inbox | `Inbox` |
| Activity log | `Activity` |
| Settings | `Settings` |
| Add/create | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Expand | `ChevronDown` |
| External link | `ExternalLink` |
| Warning | `AlertTriangle` |
| Expiring | `Clock` |
