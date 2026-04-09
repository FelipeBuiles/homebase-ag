## Areas

- Agents
- Groceries
- Review framework
- Synonyms/Normalization
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/grocery-item-normalization-agent`)
- [ ] 1.0 Define normalization proposal structure and grouping per session
  - [ ] 1.1 Define proposal schema for name/category/unit changes
  - [ ] 1.2 Define grouping rules for one proposal per session across lists
  - [ ] 1.3 Define confidence and merge metadata fields
- [ ] 2.0 Implement normalization logic for names, categories, and units
  - [ ] 2.1 Implement name normalization using synonyms and patterns
  - [ ] 2.2 Implement category normalization rules
  - [ ] 2.3 Implement quantity unit normalization rules
- [ ] 3.0 Add duplicate merge suggestion logic
  - [ ] 3.1 Define duplicate detection criteria across lists
  - [ ] 3.2 Implement merge suggestion proposal generation
  - [ ] 3.3 Define merge behavior for quantities in proposals
- [ ] 4.0 Add manual and event-based triggers
  - [ ] 4.1 Implement manual trigger entry point
  - [ ] 4.2 Hook normalization to item add/edit events
  - [ ] 4.3 Ensure trigger behavior avoids duplicate runs
- [ ] 5.0 Add tests for normalization proposals and merges
  - [ ] 5.1 Add unit tests for normalization rules and synonyms
  - [ ] 5.2 Add unit tests for duplicate detection and merge proposals
  - [ ] 5.3 Add unit tests for trigger behavior
