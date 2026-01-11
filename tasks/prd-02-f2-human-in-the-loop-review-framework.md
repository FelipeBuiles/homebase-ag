# PRD: Human-in-the-Loop Review Framework (F2)

## Introduction/Overview
HomeBase must ensure AI agents never mutate data directly. This feature establishes a human-in-the-loop review framework so users can review, understand, and approve or reject AI proposals with full transparency. The goal is to build trust and maintain user control.

## Goals
- Provide a dedicated review inbox and inline review panels for AI proposals.
- Allow users to accept all, reject all, or selectively accept/reject proposed changes.
- Display proposal metadata including agent name, timestamp, rationale, confidence, and before/after diffs.
- Store rejected proposals in audit history for later review.

## User Stories
- As a household owner, I want a review inbox so I can see all pending AI proposals in one place.
- As a household owner, I want to review proposals inline on items so I can decide in context.
- As a household owner, I want to accept or reject individual changes so I stay in control.
- As a household owner, I want to see why an agent suggested something and how confident it is.
- As a household owner, I want rejected proposals kept in history so I can revisit decisions.

## Functional Requirements
1. The system must provide a review inbox page that lists all pending proposals.
2. The system must provide inline review panels on affected items where applicable.
3. The system must allow users to accept all, reject all, or selectively accept/reject each proposed change.
4. The system must display agent name, timestamp, rationale, confidence, and before/after diffs for each proposal.
5. The system must store rejected proposals in an audit history accessible to the user.
6. The system must ensure proposals are applied only after explicit user approval.

## Non-Goals (Out of Scope)
- Automated acceptance rules or auto-approval
- Multi-user review workflows
- External notifications (email, SMS, push)

## Design Considerations (Optional)
- Use a consistent proposal card layout across inbox and inline views.
- Highlight diffs clearly with before/after views to reduce errors.
- Provide clear status labels (pending, accepted, rejected).

## Technical Considerations (Optional)
- Proposals should be stored in a way that allows reconstructing diffs over time.
- Inline review should reuse the same proposal rendering as the inbox to avoid divergent behavior.

## Success Metrics
- 100% of AI-proposed changes require explicit user approval before applying.
- Users can complete review actions without confusion (measured by low rejection of “accidental” acceptances).
- Rejected proposals are visible in audit history with complete metadata.

## Open Questions
- Should accepted proposals remain visible in audit history indefinitely?
- What is the maximum size or complexity of diffs we want to support in MVP?
- How should multiple proposals affecting the same item be grouped or ordered?
