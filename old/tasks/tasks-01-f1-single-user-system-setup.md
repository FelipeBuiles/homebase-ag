## Areas

- Setup
- Auth
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/single-user-system-setup`)
- [x] 1.0 Define setup entry points (Docker + CLI) and required configuration values
  - [x] 1.1 Inventory existing setup documentation and identify gaps for Docker and CLI flows
  - [x] 1.2 Define required configuration values for first-time setup (e.g., storage path, optional password)
  - [x] 1.3 Decide the minimal configuration needed before loading the dashboard
- [x] 2.0 Implement or update setup checklist experience in the UI
  - [x] 2.1 Define checklist items aligned with setup requirements and dashboard readiness
  - [x] 2.2 Add or update the checklist UI component in the setup flow
  - [x] 2.3 Ensure checklist is accessible after setup completion
  - [ ] 2.4 Add or update unit tests for the setup checklist behavior
- [ ] 3.0 Add optional password setup for single local user (DEFERRED)
  - [ ] 3.1 Define optional password UX (skip vs set) in the setup flow (DEFERRED)
  - [ ] 3.2 Implement local password storage/validation logic for a single user (DEFERRED)
  - [ ] 3.3 Add or update unit tests for local auth paths (DEFERRED)
- [x] 4.0 Document setup flows and validation steps
  - [x] 4.1 Update Docker setup documentation with required configuration and checklist expectations
  - [x] 4.2 Update CLI setup documentation with required configuration and checklist expectations
  - [x] 4.3 Add validation steps or troubleshooting notes for common setup issues

## Notes
- Auth/password work is deferred for MVP. Treat tasks 3.0–3.3 as “to be implemented.”
- Current setup/lock wiring is partial; revisit after main setup flow is stable.
