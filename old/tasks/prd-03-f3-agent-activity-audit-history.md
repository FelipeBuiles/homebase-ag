# PRD: Agent Activity & Audit History (F3)

## Introduction/Overview
HomeBase should make agent behavior observable and explainable over time. This feature provides an Agent Activity view and comprehensive audit history so users can see what agents did, why they did it, and the resulting proposals, preserving trust and debuggability.

## Goals
- Provide a dedicated Agent Activity page and a dashboard activity feed widget.
- Allow all-time activity visibility with search by agent, type, and status.
- Show full activity details including agent name, timestamp, trigger, and proposal summaries.
- Allow users to inspect proposal details directly from activity entries.
- Maintain audit history for both accepted and rejected proposals.

## User Stories
- As a household owner, I want a dedicated activity page so I can review all agent actions over time.
- As a household owner, I want a dashboard feed so I can see recent agent activity at a glance.
- As a household owner, I want to filter activity by agent, type, or status so I can find specific events.
- As a household owner, I want to open proposal details from an activity entry so I can understand the change.
- As a household owner, I want both accepted and rejected proposals stored so I can audit past decisions.

## Functional Requirements
1. The system must provide a dedicated Agent Activity page.
2. The system must provide an activity feed widget on the dashboard.
3. The system must support all-time activity with search by agent, type, and status.
4. Each activity entry must include agent name, timestamp, trigger/event source, and proposal summaries.
5. The system must allow users to open proposal details from activity entries (link or in-place diff).
6. The system must maintain audit history for both accepted and rejected proposals.

## Non-Goals (Out of Scope)
- Real-time notifications for agent activity
- Multi-user visibility controls
- External analytics or reporting integrations

## Design Considerations (Optional)
- Use a consistent activity entry card that matches proposal cards from the review flow.
- Provide clear filters and search inputs on the activity page.
- Dashboard widget should be concise and prioritize recent items.

## Technical Considerations (Optional)
- Activity records should be immutable and append-only.
- Link activity entries to proposal IDs to enable detail retrieval.

## Success Metrics
- Users can locate a specific agent action using filters/search without manual scanning.
- Activity entries consistently link to proposal details with no missing references.
- Audit history remains complete for accepted and rejected proposals.

## Open Questions
- What activity types should be shown beyond proposal generation (e.g., agent failures)?
- How many items should appear in the dashboard activity widget by default?
- Should activity filters include date ranges in addition to search?
