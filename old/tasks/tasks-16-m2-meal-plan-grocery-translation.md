## Areas

- Meal planning
- Groceries
- Pantry
- Review framework
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/meal-plan-grocery-translation`)
- [ ] 1.0 Define translation inputs and output selection (new vs existing list)
  - [ ] 1.1 Define inputs: selected meal plan, target list selection, pantry data
  - [ ] 1.2 Define output structures for new list vs existing list additions
  - [ ] 1.3 Define duplicate handling prompt behavior and defaults
- [ ] 2.0 Implement translation logic with structured ingredient preference
  - [ ] 2.1 Map meal plan recipes to structured ingredients when available
  - [ ] 2.2 Fallback to raw text ingredients when structured data is missing
  - [ ] 2.3 Normalize ingredient names/units before list generation
- [ ] 3.0 Add duplicate detection and user resolution prompts
  - [ ] 3.1 Implement duplicate detection on target list
  - [ ] 3.2 Build UI prompts for user resolution choices
  - [ ] 3.3 Apply user choices to generated list output
- [ ] 4.0 Apply pantry-based quantity reductions
  - [ ] 4.1 Implement pantry matching and quantity subtraction logic
  - [ ] 4.2 Handle unit mismatches and partial matches
  - [ ] 4.3 Ensure reductions are visible in preview/proposals
- [ ] 5.0 Integrate review framework for pantry conflicts
  - [ ] 5.1 Define what constitutes a pantry conflict
  - [ ] 5.2 Route translation changes through review when conflicts exist
  - [ ] 5.3 Ensure review proposals show pantry adjustment rationale
- [ ] 6.0 Add tests for translation and conflict handling
  - [ ] 6.1 Add unit tests for translation logic and ingredient mapping
  - [ ] 6.2 Add unit tests for duplicate detection and resolution
  - [ ] 6.3 Add unit tests for pantry reduction and conflict routing
