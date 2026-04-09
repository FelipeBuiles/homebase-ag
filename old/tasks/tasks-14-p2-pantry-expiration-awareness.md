## Areas

- Pantry
- Dashboard widgets
- Settings
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/pantry-expiration-awareness`)
- [ ] 1.0 Extend pantry model with expiration/opened dates and status
  - [ ] 1.1 Add expiration date and opened date fields with optional/unknown state
  - [ ] 1.2 Add consumed/discarded status fields
  - [ ] 1.3 Define expiration calculation rules with opened date
- [ ] 2.0 Build expiration input fields and validation
  - [ ] 2.1 Implement expiration and opened date inputs in pantry form
  - [ ] 2.2 Add validation and unknown/clear controls
  - [ ] 2.3 Ensure field visibility in edit mode
- [ ] 3.0 Implement expiring soon view and list highlights
  - [ ] 3.1 Build expiring soon view with filters for expiring/expired
  - [ ] 3.2 Add highlights in pantry list for expiring items
  - [ ] 3.3 Add status badges for expiring vs expired
- [ ] 4.0 Add dashboard widget for expiring items
  - [ ] 4.1 Implement widget list of top expiring items
  - [ ] 4.2 Add navigation from widget to expiring view
- [ ] 5.0 Add consumed/discarded actions and handling
  - [ ] 5.1 Add quick actions for consumed/discarded in list/detail views
  - [ ] 5.2 Define how consumed/discarded items are filtered or archived
- [ ] 6.0 Add settings for warning window
  - [ ] 6.1 Add user setting for warning window days
  - [ ] 6.2 Wire warning window into expiration logic
- [ ] 7.0 Add tests for expiration logic and views
  - [ ] 7.1 Add unit tests for expiration calculations and warning window
  - [ ] 7.2 Add unit tests for expiring view and list highlights
  - [ ] 7.3 Add unit tests for consumed/discarded actions
