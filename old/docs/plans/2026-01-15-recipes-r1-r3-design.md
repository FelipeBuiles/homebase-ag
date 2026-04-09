# Recipes R1–R3 Design — Import-First Modal + Agent Parsing

## Scope
- **R1**: Recipe storage & organization
- **R2**: Recipe URL import
- **R3**: Recipe ingredient structuring

## Goals
- Make URL import the default, lowest-friction path.
- Keep editing always possible, even while parsing runs.
- Preserve human control: auto-fill until edited, never overwrite user changes.
- Ensure recipes are saved only when name + ingredients + instructions are present.

## Design Direction
- **Warmth & approachability**: soft surfaces, calm microcopy, gentle highlights.
- **Depth**: subtle single-shadow or border-led elevation, consistent with existing UI.
- **Typography**: friendly hierarchy; labels clear, body light but readable.

## Primary UX Flow (Modal)
- Primary “Add Recipe” opens a **centered modal** (no dedicated `/recipes/new` page).
- Modal is **URL-first** with a “Add without a URL” link for manual entry.
- After URL submit, **stepper** shows Fetch → Parse → Fill with a warm progress bar.
- Fields are editable immediately; parsed values fill in place with subtle highlight.
- Any edited field is locked from future auto-overwrites and marked with an “Edited” chip.

## Modal Structure
- **Header**: Title, subtitle, close.
- **Stepper**: compact, calm state indicator.
- **URL field**: stays visible; shows “Re-parse” once parsed data exists.
- **Form sections**:
  - Details (name, description)
  - Ingredients (hybrid editor)
  - Instructions (split into steps)
- **Footer**: Save (primary), Save Draft (secondary), Cancel.

## Hybrid Ingredients Editor
- **Paste box** accepts raw text; on multiline input, it auto-splits into rows.
- Rows expose **quantity / unit / name** fields.
- Row editing marks that row “Edited” and locks it from auto-fill.
- Raw paste area remains collapsible for power users.

## Instructions Editor
- Paste box auto-splits into numbered steps.
- Steps are editable with add/remove controls.
- If parse returns one block, split by sentence but provide a “Keep as one block” toggle.

## Agent Integration
- On URL submit:
  - Create **draft Recipe** immediately (status: `draft`, parsing: `pending`).
  - Enqueue **recipe-parser** job (queue-backed agent).
- Parser returns structured fields:
  - name, description, ingredients[], instructions[].
- UI auto-fills any **untouched** fields; edited fields remain unchanged.
- “Re-parse” queues a new job while preserving manual edits.
- If parsing fails: show inline alert and keep all fields editable.

## Validation & Save
- **Save enabled only when**: name + at least one ingredient row + at least one instruction step.
- “Save Draft” always available.
- On save, mark status `ready` and leave parsing metadata for audit.

## List + Detail Updates
- **Recipes list**:
  - Primary add button opens modal.
  - Optional search + subtle import hint.
  - Empty state includes a URL input + “Add manually” link.
- **Recipe detail**:
  - Tighter layout, better instruction styling.
  - Ingredients display as clean rows with subtle separators.

## Routing
- `/recipes/new` redirects to `/recipes`.

## Error Handling
- URL parse failures show a gentle inline banner: “We couldn’t parse this recipe yet—continue manually.”
- Timeout and network errors do not block editing.

## Notes
- The modal should match existing dialog styles for consistency.
- No field should auto-overwrite after user input is detected.
