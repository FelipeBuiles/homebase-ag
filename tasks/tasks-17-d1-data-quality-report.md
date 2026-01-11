## Areas

- Data quality
- Review framework
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/data-quality-report`)
- [ ] 1.0 Define data quality rules across all domains
  - [ ] 1.1 Define missing field rules per domain
  - [ ] 1.2 Define duplicate detection rules per domain
  - [ ] 1.3 Define inconsistent naming rules per domain
- [ ] 2.0 Build data quality engine and issue aggregation
  - [ ] 2.1 Implement rule evaluation and issue aggregation
  - [ ] 2.2 Add issue severity and grouping by domain/type
  - [ ] 2.3 Add on-demand report generation entry point
- [ ] 3.0 Build report page with issue lists and filters
  - [ ] 3.1 Implement issue list views with domain/type filters
  - [ ] 3.2 Add detail panels linking to affected items
  - [ ] 3.3 Add bulk fix entry points per issue type
- [ ] 4.0 Build dashboard summary widget
  - [ ] 4.1 Implement summary counts by domain/type
  - [ ] 4.2 Add navigation to full report page
- [ ] 5.0 Implement bulk fix suggestion flows
  - [ ] 5.1 Build bulk fix suggestion UI and preview
  - [ ] 5.2 Route bulk fixes through review framework
  - [ ] 5.3 Track accepted/rejected bulk fixes in audit history
- [ ] 6.0 Add tests for detection and reporting
  - [ ] 6.1 Add unit tests for detection rules per domain
  - [ ] 6.2 Add unit tests for report aggregation and filters
  - [ ] 6.3 Add unit tests for bulk fix proposal routing
