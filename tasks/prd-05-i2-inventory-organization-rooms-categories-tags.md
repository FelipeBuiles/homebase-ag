# PRD: Inventory Organization (Rooms, Categories, Tags) (I2)

## Introduction/Overview
HomeBase needs flexible organization so inventory items reflect real-world locations and groupings. This feature enables user-defined rooms and tags, predefined categories, multi-select assignment, and bulk edits to keep the inventory findable and consistent.

## Goals
- Allow users to define rooms and tags; provide predefined categories.
- Enable multi-select for rooms, categories, and tags on inventory items.
- Provide organization management via a combined settings screen and inline creation.
- Support bulk editing for room, category, and tag assignments.
- Normalize tag and category names to title case.

## User Stories
- As a household owner, I want to define rooms so inventory matches my home layout.
- As a household owner, I want to use tags to group items across categories.
- As a household owner, I want to assign multiple rooms/categories/tags when items span contexts.
- As a household owner, I want to edit organization fields in bulk to save time.
- As a household owner, I want a single settings screen to manage organization values.

## Functional Requirements
1. The system must allow users to create and manage rooms.
2. The system must provide predefined categories and allow selection from them.
3. The system must allow users to create and manage tags.
4. The system must support multi-select assignment for rooms, categories, and tags on items.
5. The system must provide a combined “Organization Settings” screen for managing rooms/tags.
6. The system must allow inline creation of rooms/tags during item editing.
7. The system must support bulk editing of rooms, categories, and tags across multiple items.
8. The system must normalize tag and category names to title case.

## Non-Goals (Out of Scope)
- AI-driven auto-tagging or categorization (handled in I5)
- Location hierarchy (e.g., room → shelf)
- Shared or multi-user organization settings

## Design Considerations (Optional)
- Use consistent multi-select UI patterns for all organization fields.
- Organization settings should show counts of items per room/tag for context.

## Technical Considerations (Optional)
- Predefined categories should be stored separately from user-defined rooms/tags.
- Bulk edit operations should be reversible via the review framework.

## Success Metrics
- Users can assign organization metadata in under 10 seconds per item.
- Bulk edit reduces time spent reorganizing items by at least 50%.

## Open Questions
- What is the initial predefined category list?
- Should users be able to disable or hide predefined categories?
- How should multi-room items be displayed in lists and filters?
