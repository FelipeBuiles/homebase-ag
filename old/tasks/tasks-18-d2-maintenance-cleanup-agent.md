## Areas

- Agents
- Data quality
- Review framework
- Testing

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/maintenance-cleanup-agent`)
- [ ] 1.0 Define maintenance suggestion types and confidence thresholds
  - [ ] 1.1 Define suggestion types for duplicates, missing fields, stale items, normalization
  - [ ] 1.2 Define high-confidence threshold and destructive action rules
  - [ ] 1.3 Define per-domain grouping structure
- [ ] 2.0 Implement agent logic using data quality report outputs
  - [ ] 2.1 Ingest data quality report outputs as inputs
  - [ ] 2.2 Generate proposals for each suggestion type
  - [ ] 2.3 Ensure destructive proposals are gated by high confidence
- [ ] 3.0 Add trigger after data quality report generation
  - [ ] 3.1 Hook agent trigger to report generation completion
  - [ ] 3.2 Ensure manual suppression is possible if needed
- [ ] 4.0 Group proposals by domain and enforce high-confidence rules
  - [ ] 4.1 Group proposals by domain with counts
  - [ ] 4.2 Enforce high-confidence threshold on all proposals
  - [ ] 4.3 Label destructive proposals clearly in output
- [ ] 5.0 Add tests for maintenance proposals and triggers
  - [ ] 5.1 Add unit tests for suggestion generation and confidence gating
  - [ ] 5.2 Add unit tests for trigger behavior after reports
  - [ ] 5.3 Add unit tests for grouping and destructive proposal flags
