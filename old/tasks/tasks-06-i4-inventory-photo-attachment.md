## Areas

- Inventory
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/inventory-photo-attachment`)
- [ ] 1.0 Define attachment data model and ordering
  - [ ] 1.1 Define attachment schema for photos and videos with ordering
  - [ ] 1.2 Define validation rules (file type, size limits if any)
  - [ ] 1.3 Define primary attachment selection rules
- [ ] 2.0 Build upload UI for photos and videos
  - [ ] 2.1 Implement uploader component for multi-file selection
  - [ ] 2.2 Implement upload progress/error states
  - [ ] 2.3 Support drag-and-drop reorder controls
- [ ] 3.0 Display thumbnails in inventory list
  - [ ] 3.1 Add thumbnail rendering in list items
  - [ ] 3.2 Provide fallback thumbnail for videos
  - [ ] 3.3 Ensure list layout handles missing attachments
- [ ] 4.0 Build item detail gallery with reordering
  - [ ] 4.1 Implement gallery view with carousel or grid
  - [ ] 4.2 Enable reorder controls in detail view
  - [ ] 4.3 Ensure primary attachment displays first
- [ ] 5.0 Add optional attachments to quick-add flow
  - [ ] 5.1 Add optional upload entry point in quick-add
  - [ ] 5.2 Ensure quick-add uploads persist with item creation
- [ ] 6.0 Add tests for attachment upload and display
  - [ ] 6.1 Add unit tests for attachment model and ordering
  - [ ] 6.2 Add unit tests for uploader behaviors
  - [ ] 6.3 Add unit tests for list thumbnails and gallery rendering
