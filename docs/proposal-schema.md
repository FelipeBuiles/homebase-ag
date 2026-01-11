# Proposal Schema (Diff + Snapshot)

This document defines the canonical JSON shape for proposals and changes. The same structure is used for agent suggestions, bulk fixes, and any automated recommendations.

## Proposal

```json
{
  "id": "prop_123",
  "agentId": "agent_inventory_enrichment",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00Z",
  "summary": "Inventory enrichment suggestions",
  "changes": [
    {
      "entityType": "InventoryItem",
      "entityId": "inv_abc",
      "confidence": 0.92,
      "diff": [
        { "op": "replace", "path": "/categoryId", "value": "cat_kitchen" },
        { "op": "add", "path": "/tags/-", "value": "fragile" }
      ],
      "before": {
        "name": "Blender",
        "categoryId": null,
        "tags": []
      },
      "after": {
        "name": "Blender",
        "categoryId": "cat_kitchen",
        "tags": ["fragile"]
      },
      "rationale": "Matches kitchen appliance patterns",
      "metadata": {
        "suggestionType": "enrichment",
        "source": "agent"
      }
    }
  ]
}
```

## Fields

### Proposal
- `id`: Stable unique ID for the proposal.
- `agentId`: Agent that generated the proposal.
- `status`: `pending | accepted | rejected`.
- `createdAt`: ISO timestamp.
- `summary`: Short, human-readable description.
- `changes`: Array of `ProposalChange` objects.

### ProposalChange
- `entityType`: Domain model name (e.g., `InventoryItem`).
- `entityId`: Stable ID of the target entity.
- `confidence`: Float between 0 and 1.
- `diff`: JSON Patch operations (`op`, `path`, `value`).
- `before`: Snapshot of relevant fields before change.
- `after`: Snapshot of relevant fields after change.
- `rationale`: Human-readable explanation for the change.
- `metadata`: Free-form object for tagging (e.g., `suggestionType`).

## Rules
- `diff` and `before/after` are always included for every change.
- `before/after` should include only fields referenced by `diff`.
- `confidence` is required and must align with per-suggestion thresholds.
- `entityType` values must match the domain models used in the system.
- `metadata.suggestionType` should align with agent type (e.g., `normalization`, `duplicate`, `cleanup`).

## Notes
- JSON Patch format follows RFC 6902 (`op`, `path`, `value`).
- All proposals are routed through the review framework; no direct mutations.
