# PRD: Agent Prompt & Behavior Configuration (X1)

## Introduction/Overview
HomeBase should allow the household owner to tune agent behavior for better outcomes and faster iteration. This feature provides UI access to agent configuration, supports configuration of prompts, thresholds, triggers, and model/provider settings, and records a versioned history with rollback. Changes must go through review.

## Goals
- Provide a dedicated Agent Settings page and per-agent settings views.
- Allow configuration of prompts, thresholds, triggers, and model/provider settings.
- Restrict edits to the household owner.
- Route configuration changes through the review framework.
- Version and store configuration history with rollback.

## User Stories
- As a household owner, I want to adjust agent prompts so behavior improves over time.
- As a household owner, I want to tune thresholds and triggers so agents behave predictably.
- As a household owner, I want to review configuration changes before they apply.
- As a household owner, I want to roll back to a prior configuration when needed.

## Functional Requirements
1. The system must provide a dedicated Agent Settings page and per-agent settings views.
2. The system must allow editing of prompts, thresholds, triggers, and model/provider settings.
3. The system must restrict configuration editing to the household owner.
4. The system must route all configuration changes through the review framework.
5. The system must maintain version history of agent configurations.
6. The system must allow rollback to a prior configuration version.

## Non-Goals (Out of Scope)
- Multi-user configuration workflows
- Real-time collaborative editing
- Automatic prompt optimization

## Design Considerations (Optional)
- Show a diff between current and proposed configurations.
- Provide clear indicators for active vs historical versions.

## Technical Considerations (Optional)
- Configuration versions should be immutable and append-only.
- Rollback should create a new version entry for traceability.

## Success Metrics
- Users can update an agent configuration and review changes in under 2 minutes.
- Rollback is used successfully without data loss.

## Open Questions
- Should model/provider changes be restricted to certain agents?
- Are there default templates for prompts per agent?
- How should trigger changes be validated?
