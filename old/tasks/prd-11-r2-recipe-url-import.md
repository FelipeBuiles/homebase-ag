# PRD: Recipe URL Import (R2)

## Introduction/Overview
HomeBase should reduce friction in adding recipes by allowing users to import from any public URL. This feature fetches and parses recipe data, presents an editable preview, and falls back to manual entry on failure.

## Goals
- Support importing recipes from any public URL with HTML.
- Require user-initiated import (no auto-fetch on paste).
- Extract full recipe fields including title, ingredients, instructions, tags, and categories.
- Provide an editable preview before saving.
- Allow manual entry if parsing fails.

## User Stories
- As a household owner, I want to paste a URL and import a recipe so I don’t have to retype it.
- As a household owner, I want to review and edit parsed fields before saving.
- As a household owner, I want to still add the recipe manually if import fails.

## Functional Requirements
1. The system must allow users to paste any public URL and trigger an import action.
2. The system must fetch and parse recipe data only after the user clicks “Import.”
3. The system must attempt to extract title, ingredients, instructions, tags, and categories.
4. The system must display an editable preview of the parsed recipe before saving.
5. The system must show an error and offer manual entry if parsing fails.

## Non-Goals (Out of Scope)
- Private or authenticated URLs
- Bulk import
- Automatic tagging beyond parsed content

## Design Considerations (Optional)
- Provide a clear parsing status indicator (loading, success, error).
- Editable preview should reuse the recipe form for consistency.

## Technical Considerations (Optional)
- Parsing should handle common HTML patterns and fallback to schema.org where available.
- URL fetch should handle basic validation and timeouts.

## Success Metrics
- Users can import a recipe in under 1 minute for typical sites.
- Import failures always allow manual completion without losing progress.

## Open Questions
- How should tags/categories be inferred if not present on the page?
- Should the system store the source URL for provenance?
- What is the acceptable timeout for URL fetch?
