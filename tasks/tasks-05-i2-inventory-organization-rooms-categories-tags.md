## Areas

- Inventory
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/inventory-organization-rooms-categories-tags`)
- [ ] 1.0 Define organization data model for rooms, categories, and tags
  - [ ] 1.1 Define room and tag schemas with title-case normalization rules
  - [ ] 1.2 Define predefined category list storage and access pattern
  - [ ] 1.3 Define multi-select relationships between items and organization fields
- [ ] 2.0 Build organization settings screen and inline creation flows
  - [ ] 2.1 Design combined settings screen for rooms and tags
  - [ ] 2.2 Implement add/edit/remove for rooms and tags
  - [ ] 2.3 Add inline creation for rooms/tags within item forms
- [ ] 3.0 Update item form with multi-select assignment
  - [ ] 3.1 Implement multi-select UI for rooms, categories, and tags
  - [ ] 3.2 Ensure selected values persist on edit
  - [ ] 3.3 Enforce title-case normalization on assignment
- [ ] 4.0 Implement bulk edit for organization fields
  - [ ] 4.1 Define bulk edit entry point from inventory list
  - [ ] 4.2 Implement bulk edit modal for room/category/tag changes
  - [ ] 4.3 Ensure bulk edits follow review framework for changes
- [ ] 5.0 Add tests for organization management and assignment
  - [ ] 5.1 Add tests for normalization and model behavior
  - [ ] 5.2 Add tests for settings screen CRUD actions
  - [ ] 5.3 Add tests for multi-select and bulk edit flows
