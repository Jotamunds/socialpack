---
profile_version: "1.0"
project_type: "site"
status: "bootstrap_required"
project_name: "UNSET"
source_of_truth: "repository"
primary_harness: "instructions/harnesses/SITES_HARNESS.md"
additional_harnesses: []

execution:
  task_source: "WORK_ORDER.md"
  state_file: "PROJECT_STATE.md"
  state_tracking: true
  default_autonomy: "standard"

stack:
  runtime: "DETECT"
  framework: "DETECT"
  language: "DETECT"
  package_manager: "DETECT"
  rendering_model: "DETECT"

paths:
  project_root: "."
  source: "DETECT"
  routes: "DETECT"
  components: "DETECT"
  styles: "DETECT"
  tests: "DETECT"
  public_assets: "DETECT"

commands:
  install: "DETECT"
  dev: "DETECT"
  lint: "DETECT"
  typecheck: "DETECT"
  test: "DETECT"
  build: "DETECT"
  e2e: "DETECT"

design:
  source: "DETECT"
  design_system: "DETECT"
  token_source: "DETECT"
  reference_assets: "DETECT"

browser_targets:
  - "DETECT"
breakpoints:
  - "DETECT"

integrations:
  authentication: "DETECT"
  database: "DETECT"
  api: "DETECT"
  analytics: "DETECT"
  payments: "DETECT"

validation:
  browser_available: "DETECT"
  visual_reference_available: "DETECT"
  accessibility_tooling: "DETECT"
  required_commands: []

permissions:
  edit_repository: true
  install_dependencies: false
  change_environment: false
  migrate_data: false
  commit: false
  push: false
  deploy: false
  change_domain_or_access: false

protected_areas: []
known_constraints: []
---

# Site Project Profile

This file stores stable project facts. During bootstrap, replace `DETECT` only with observed values and leave unresolved decisions as `UNSET`.

## Product boundaries

- Primary user: `UNSET`
- Primary outcome: `UNSET`
- Supported locales: `UNSET`
- Explicit non-goals: `UNSET`

## Architecture notes

- `DETECT`

## Environment notes

- Never place secret values in this file.
- Record environment variable names only when useful; never record their values.
