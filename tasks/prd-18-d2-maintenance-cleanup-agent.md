# PRD: Maintenance & Cleanup Agent (D2)

## Introduction/Overview
HomeBase should proactively propose system improvements to keep data clean and usable over time. This feature introduces a maintenance agent that runs after data quality report generation and suggests fixes for duplicates, missing fields, stale items, and normalization issues, grouped by domain and gated by high confidence.

## Goals
- Propose maintenance suggestions for duplicates, missing fields, stale items, and normalization fixes.
- Trigger the agent after data quality report generation.
- Group suggestions by domain.
- Allow destructive actions only when confidence is high.
- Require high confidence for all proposals.

## User Stories
- As a household owner, I want the system to suggest cleanup tasks so I can keep data healthy.
- As a household owner, I want suggestions grouped by domain so I can address them systematically.
- As a household owner, I want only high-confidence suggestions so I can trust the proposals.
- As a household owner, I want destructive proposals only when confidence is high.

## Functional Requirements
1. The system must generate maintenance suggestions for duplicates, missing fields, stale items, and normalization issues.
2. The system must trigger the maintenance agent after data quality report generation.
3. The system must group suggestions by domain.
4. The system must allow destructive actions only when confidence is high.
5. The system must enforce a high-confidence threshold for all proposals.
6. The system must route all proposals through the review framework.

## Non-Goals (Out of Scope)
- Automatic application of maintenance fixes
- Scheduled or continuous background runs
- Multi-user maintenance workflows

## Design Considerations (Optional)
- Provide a domain summary with counts of suggested fixes.
- Clearly label destructive actions in proposal UI.

## Technical Considerations (Optional)
- Reuse data quality report outputs as inputs to reduce duplicate work.
- Confidence scoring should be consistent across domains.

## Success Metrics
- Users can review and apply maintenance suggestions with minimal confusion.
- Maintenance proposals reduce duplicate and inconsistent data over time.

## Open Questions
- How should “stale” be defined per domain?
- Should the agent skip domains with no detected issues?
- Should high-confidence destructive actions require extra confirmation?
