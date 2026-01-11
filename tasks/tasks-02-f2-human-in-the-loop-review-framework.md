## Areas

- Review framework
- Audit history
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/human-in-the-loop-review-framework`)
- [ ] 1.0 Define proposal data model and review actions
  - [ ] 1.1 Define proposal status lifecycle (pending, accepted, rejected) and required metadata fields
  - [ ] 1.2 Specify diff representation for before/after changes in MVP
  - [ ] 1.3 Define accept/reject actions and auditing behaviors
- [ ] 2.0 Build review inbox UI for pending proposals
  - [ ] 2.1 Design inbox layout and filtering for pending proposals
  - [ ] 2.2 Implement list view with proposal cards and bulk actions
  - [ ] 2.3 Add empty state and loading behavior
- [ ] 3.0 Build inline review panel for item-level review
  - [ ] 3.1 Define inline panel triggers and placement on item pages
  - [ ] 3.2 Implement inline view using shared proposal card components
  - [ ] 3.3 Ensure inline actions stay in sync with inbox status
- [ ] 4.0 Implement proposal card with metadata and diffs
  - [ ] 4.1 Define consistent metadata layout (agent, timestamp, rationale, confidence)
  - [ ] 4.2 Render before/after diff in a readable format for MVP
  - [ ] 4.3 Add status labels and action buttons for accept/reject
- [ ] 5.0 Store and display rejected proposals in audit history
  - [ ] 5.1 Define audit history view and filtering for rejected proposals
  - [ ] 5.2 Ensure rejected proposals are persisted with full metadata
  - [ ] 5.3 Add navigation from inbox to audit history
- [ ] 6.0 Add tests for review flows and proposal rendering
  - [ ] 6.1 Add unit tests for proposal lifecycle actions
  - [ ] 6.2 Add unit tests for proposal card metadata and diff rendering
  - [ ] 6.3 Add unit tests for inbox and inline review interactions
