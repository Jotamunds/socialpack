---
profile_version: "1.0"
project_type: "release-deployment"
status: "bootstrap_required"
project_name: "UNSET"
source_of_truth: "repository"
primary_harness: "instructions/harnesses/RELEASE_DEPLOYMENT_HARNESS.md"
additional_harnesses: []

execution:
  task_source: "WORK_ORDER.md"
  state_file: "PROJECT_STATE.md"
  state_tracking: true
  default_autonomy: "restricted"

repository:
  remote: "DETECT"
  default_branch: "DETECT"
  release_branch: "DETECT"
  protected_branches: "DETECT"

release:
  versioning: "DETECT"
  version_source: "DETECT"
  changelog: "DETECT"
  tag_format: "DETECT"
  artifact_authority: "DETECT"

ci_cd:
  provider: "DETECT"
  workflow_files: "DETECT"
  required_checks: "DETECT"
  build_command: "DETECT"
  artifact_output: "DETECT"

environments:
  preview: "DETECT"
  staging: "DETECT"
  production: "DETECT"

operations:
  deployment_method: "DETECT"
  health_checks: "DETECT"
  smoke_tests: "DETECT"
  rollback_method: "DETECT"
  approval_authority: "DETECT"

permissions:
  commit: false
  push: false
  tag: false
  create_release: false
  deploy_preview: false
  deploy_staging: false
  deploy_production: false
  change_environment: false
  change_domain_or_access: false
  run_migrations: false
  rollback: false

known_constraints: []
---

# Release and Deployment Project Profile

Replace `DETECT` only with verified facts. Keep all external permissions `false` until intentionally configured.

## Promotion path

- `UNVERIFIED`

## Required approval gates

- `UNVERIFIED`

## Recovery notes

- `UNVERIFIED`
- Never store secret values in this file.
