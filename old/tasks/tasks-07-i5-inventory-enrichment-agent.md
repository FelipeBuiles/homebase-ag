## Areas

- Agents
- Review framework
- Inventory
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/inventory-enrichment-agent`)
- [ ] 1.0 Define enrichment proposal structure and grouping per session
  - [ ] 1.1 Define proposal schema for category/location/tag suggestions
  - [ ] 1.2 Define session grouping rules for multi-item proposals
  - [ ] 1.3 Define confidence fields for suggestions and duplicates
- [ ] 2.0 Implement enrichment agent logic and confidence handling
  - [ ] 2.1 Implement suggestion generation from item name, photos, and patterns
  - [ ] 2.2 Implement confidence scoring and thresholds
  - [ ] 2.3 Ensure proposals route through review framework
- [ ] 3.0 Add manual and event-based triggers
  - [ ] 3.1 Implement manual trigger entry point for enrichment runs
  - [ ] 3.2 Hook enrichment to item creation/edit events
  - [ ] 3.3 Ensure trigger behavior avoids duplicate runs
- [ ] 4.0 Surface duplicate warnings with high confidence
  - [ ] 4.1 Define duplicate warning criteria and threshold
  - [ ] 4.2 Include duplicate warnings in proposal summaries
- [ ] 5.0 Add tests for enrichment proposals and triggers
  - [ ] 5.1 Add unit tests for proposal grouping and confidence fields
  - [ ] 5.2 Add unit tests for trigger behavior on create/edit
  - [ ] 5.3 Add unit tests for duplicate warning thresholds
