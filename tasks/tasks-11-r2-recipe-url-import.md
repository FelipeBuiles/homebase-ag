## Areas

- Recipes
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/recipe-url-import`)
- [ ] 1.0 Define URL import flow and parsed recipe schema
  - [ ] 1.1 Define fields to extract (title, ingredients, instructions, tags, categories)
  - [ ] 1.2 Define error states and fallback to manual entry
  - [ ] 1.3 Define how source URL is stored with recipe data
- [ ] 2.0 Build import UI with manual trigger and status states
  - [ ] 2.1 Implement URL input and import button
  - [ ] 2.2 Add loading, success, and error states
  - [ ] 2.3 Add manual entry fallback path on error
- [ ] 3.0 Implement URL fetch and parsing logic
  - [ ] 3.1 Implement URL validation and fetch with timeout handling
  - [ ] 3.2 Implement parsing logic with fallback strategies
  - [ ] 3.3 Map parsed fields into recipe schema
- [ ] 4.0 Build editable preview and save flow
  - [ ] 4.1 Reuse recipe form for editable preview
  - [ ] 4.2 Allow user edits before saving
  - [ ] 4.3 Save imported recipe with source metadata
- [ ] 5.0 Add tests for import parsing and preview editing
  - [ ] 5.1 Add unit tests for parsing success and failure cases
  - [ ] 5.2 Add unit tests for editable preview flow
