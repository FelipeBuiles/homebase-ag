# HomeBase — Redesign

This folder contains the full specification to rebuild HomeBase from scratch with a unified architecture and visual system. These documents replace the scattered PRDs, task files, and implementation plans in the original project.

## What changed and why

The original build worked but accumulated too many planning artifacts, inconsistent UI patterns across screens, and no shared visual language — each feature was designed in isolation. This redesign starts with a design system and a clean layered architecture before touching features.

## How to use these docs

Read them in order. Each document is self-contained but assumes the previous ones.

| File | Contents |
|------|----------|
| `stack.md` | Tech stack with rationale for each choice |
| `visual-system.md` | Design tokens, typography, component patterns |
| `architecture.md` | Project structure, data model, agent pattern, API layer |
| `build-plan.md` | Phased implementation with validation checkpoints |

## Build process

Each phase in `build-plan.md` ends with a **validation gate** — a checklist of things that must work before starting the next phase. The loop is:

```
Build phase → Run validation checklist → Fix gaps → Start next phase
```

Phases are sized to be completable in a single focused session. Never start a new phase with open items from the previous one.

## Scope

This is a **single-user, self-hosted** household management app. Multi-user, cloud deployment, native mobile, and enterprise features are permanently out of scope.
