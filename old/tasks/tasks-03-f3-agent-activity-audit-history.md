## Areas

- Activity feed
- Audit history
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/agent-activity-audit-history`)
- [ ] 1.0 Define activity data model and indexing for search/filters
  - [ ] 1.1 Define activity entry schema (agent, timestamp, trigger, status, proposal refs)
  - [ ] 1.2 Define searchable fields and filter options (agent/type/status)
  - [ ] 1.3 Define how activity links to proposal/audit records
- [ ] 2.0 Build Agent Activity page with search and filters
  - [ ] 2.1 Design page layout with search bar and filters
  - [ ] 2.2 Implement activity list with reusable entry card
  - [ ] 2.3 Add empty and loading states
- [ ] 3.0 Build dashboard activity feed widget
  - [ ] 3.1 Define widget item limit and summary content
  - [ ] 3.2 Implement widget list and link to full activity page
  - [ ] 3.3 Add empty state for no recent activity
- [ ] 4.0 Link activity entries to proposal details and audit history
  - [ ] 4.1 Add navigation from activity entry to proposal detail view
  - [ ] 4.2 Support in-place diff preview where applicable
  - [ ] 4.3 Ensure accepted/rejected proposals appear in audit history views
- [ ] 5.0 Add tests for activity views and data handling
  - [ ] 5.1 Add unit tests for activity store indexing and filtering
  - [ ] 5.2 Add unit tests for activity page UI states
  - [ ] 5.3 Add unit tests for dashboard widget rendering
