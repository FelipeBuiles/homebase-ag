# PRD: Single-User System Setup (F1)

## Introduction/Overview
HomeBase needs a simple, reliable setup flow for a single household owner to install, configure, and begin using the system. This feature ensures a self-hosted user can complete initial configuration and land in the main dashboard without external dependencies, while preserving privacy-first, single-user assumptions.

## Goals
- Enable a single household owner to complete initial configuration and land in the dashboard.
- Support both Docker and CLI setup paths for the MVP.
- Provide a quick-start checklist to guide first-time setup.
- Offer optional password protection for the single local user.

## User Stories
- As a household owner, I want to install HomeBase using Docker so I can run it quickly on my machine.
- As a household owner, I want a CLI setup option so I can install without Docker.
- As a household owner, I want a guided checklist so I know what steps I need to complete to start using the system.
- As a household owner, I want to optionally set a password so my local instance is protected.
- As a household owner, I want to reach the dashboard after setup so I can begin managing my household data.

## Functional Requirements
1. The system must provide a Docker-based setup path with documented steps.
2. The system must provide a CLI-based setup path with documented steps.
3. The system must guide the user through initial configuration and then route them to the main dashboard.
4. The system must present a quick-start checklist during or after setup.
5. The system must allow the single local user to set an optional password during setup or immediately after setup.
6. The system must operate as a single-user system (no multi-user flows).

## Non-Goals (Out of Scope)
- Multi-user or household member roles
- Remote access configuration (e.g., exposing ports securely to the internet)
- Backup/restore tooling
- Payments, subscriptions, or external service integrations

## Design Considerations (Optional)
- Provide a setup screen or CLI prompt flow that is minimal and friendly for a technical but non-expert user.
- Include a visible checklist component in the UI after setup to confirm readiness (e.g., “Setup complete” and next steps).

## Technical Considerations (Optional)
- Setup should not assume any external services beyond local machine requirements.
- Docker and CLI flows should converge on the same configuration outputs to avoid drift.

## Success Metrics
- User can complete setup and reach the dashboard in one session.
- At least 90% of first-time users can finish setup without external help.
- Password optionality is clear and used by a meaningful subset of users.

## Open Questions
- What minimum configuration values are required before the dashboard can load?
- Where should the setup checklist live in the UI after completion?
- Should the optional password be enforced only on UI access or also CLI/admin actions?
