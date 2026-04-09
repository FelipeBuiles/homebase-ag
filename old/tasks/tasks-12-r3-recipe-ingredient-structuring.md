## Areas

- Recipes
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/recipe-ingredient-structuring`)
- [ ] 1.0 Define structured ingredient schema with raw text
  - [ ] 1.1 Define fields (name, quantity, unit, notes, raw text)
  - [ ] 1.2 Define normalization rules for names and units
  - [ ] 1.3 Define representation for ranges and fractions
- [ ] 2.0 Implement parsing and normalization logic
  - [ ] 2.1 Implement AI parsing from free-text ingredient lines
  - [ ] 2.2 Normalize names and units during parsing
  - [ ] 2.3 Store raw text alongside structured fields
- [ ] 3.0 Build ingredient entry and editing UI
  - [ ] 3.1 Implement manual entry for structured fields
  - [ ] 3.2 Implement editing of parsed ingredients
  - [ ] 3.3 Add validation feedback for malformed inputs
- [ ] 4.0 Display structured ingredients with raw text
  - [ ] 4.1 Display structured fields with raw text reference
  - [ ] 4.2 Ensure updates reflect edits and re-parsing
- [ ] 5.0 Add tests for parsing and editing
  - [ ] 5.1 Add unit tests for parsing edge cases (fractions, ranges)
  - [ ] 5.2 Add unit tests for normalization rules
  - [ ] 5.3 Add unit tests for ingredient editor behaviors
