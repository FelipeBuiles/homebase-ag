# PRD: Inventory Photo Attachment (I4)

## Introduction/Overview
HomeBase should allow users to attach photos and videos to inventory items to improve recall, documentation, and AI enrichment readiness. This feature covers multi-attachment upload, display across views, and optional quick-add support.

## Goals
- Support photo and video attachments on inventory items.
- Allow multiple attachments per item with reordering.
- Display attachments in item detail, item list thumbnails, and a dedicated gallery view.
- Allow optional uploads during quick-add.

## User Stories
- As a household owner, I want to attach multiple photos or videos so I can document items thoroughly.
- As a household owner, I want to reorder attachments so the most useful image appears first.
- As a household owner, I want to see thumbnails in the inventory list so I can scan visually.
- As a household owner, I want a gallery view on item detail so I can review all attachments.
- As a household owner, I want to add a photo during quick-add when it is convenient.

## Functional Requirements
1. The system must allow attaching photos and videos to inventory items.
2. The system must support multiple attachments per item.
3. The system must allow users to reorder attachments.
4. The system must show attachment thumbnails in the item list.
5. The system must show attachments on the item detail view.
6. The system must provide a dedicated gallery view for an item’s attachments.
7. The system must allow optional attachment uploads during quick-add.

## Non-Goals (Out of Scope)
- Automatic media analysis or tagging
- External media hosting or sharing
- Advanced editing tools (crop, annotate)

## Design Considerations (Optional)
- Use a consistent thumbnail size in list views for quick scanning.
- The gallery view should highlight the primary attachment first.
- Reordering should be simple (drag and drop or explicit controls).

## Technical Considerations (Optional)
- Store attachment order explicitly on the item.
- Consider separate handling for video thumbnails.

## Success Metrics
- Users can upload and reorder attachments without errors.
- Visual identification of items improves with list thumbnails.

## Open Questions
- What maximum number of attachments per item is acceptable for MVP?
- What default thumbnail should be used for videos?
- Should uploads be persisted immediately or only on save?
