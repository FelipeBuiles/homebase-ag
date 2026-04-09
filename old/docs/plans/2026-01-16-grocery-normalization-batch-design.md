# Grocery Normalization Batch Design

## Goal
Normalize all grocery items that are missing `normalizedName` or `canonicalKey`, and automatically enqueue normalization for new recipe-derived items.

## Scope
- Batch trigger to enqueue normalization for all unnormalized grocery items.
- Update recipe→groceries flow to enqueue normalization for newly created items.

Out of scope:
- UI for viewing normalization jobs.
- Changing how normalization fields are computed.

## Architecture
- Use the existing `grocery` BullMQ queue and normalization agent.
- Batch helper queries for grocery items missing `normalizedName` or `canonicalKey` and enqueues jobs.
- Recipe→groceries action enqueues normalization for each created item.

## Data Flow
1. Batch trigger finds grocery items with `normalizedName` or `canonicalKey` missing.
2. Enqueue a normalization job for each item (`{ itemId, name }`).
3. Normalization agent writes `normalizedName` + `canonicalKey`.
4. Recipe→groceries add flow enqueues normalization for newly created items.

## Error Handling
- Batch continues when an item fails to enqueue.
- Enqueue failures do not block recipe→groceries additions.

## Testing
- Unit test for batch helper to ensure only missing fields are enqueued.
- Unit test that recipe→groceries enqueues normalization for new items.
