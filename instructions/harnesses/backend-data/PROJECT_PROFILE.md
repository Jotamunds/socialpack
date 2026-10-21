---
profile_version: "1.0"
project_type: "backend-data"
status: "bootstrap_required"
project_name: "UNSET"
source_of_truth: "repository"
primary_harness: "instructions/harnesses/BACKEND_DATA_HARNESS.md"
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

paths:
  server_entrypoint: "DETECT"
  api: "DETECT"
  services: "DETECT"
  models: "DETECT"
  migrations: "DETECT"
  tests: "DETECT"

api:
  style: "DETECT"
  contract_authority: "DETECT"
  base_path: "DETECT"
  versioning: "DETECT"

database:
  engine: "DETECT"
  orm_or_client: "DETECT"
  schema_authority: "DETECT"
  migration_system: "DETECT"
  test_environment: "DETECT"

infrastructure:
  cache: "DETECT"
  queues_or_jobs: "DETECT"
  external_services: "DETECT"

commands:
  install: "DETECT"
  dev: "DETECT"
  lint: "DETECT"
  typecheck: "DETECT"
  test: "DETECT"
  integration: "DETECT"
  build: "DETECT"
  migration_generate: "DETECT"
  migration_validate: "DETECT"

environments:
  local: "DETECT"
  test: "DETECT"
  staging: "DETECT"
  production: "DETECT"

permissions:
  edit_repository: true
  install_dependencies: false
  create_migration_files: true
  apply_local_migrations: false
  apply_shared_migrations: false
  apply_production_migrations: false
  modify_local_test_data: false
  modify_shared_data: false
  modify_production_data: false
  call_paid_services: false
  change_secrets: false
  commit: false
  push: false
  deploy: false

protected_data: []
known_constraints: []
---

# Backend and Data Project Profile

Replace `DETECT` only with observed facts. Keep unresolved product or policy decisions as `UNSET`.

## Contract and compatibility notes

- `UNVERIFIED`

## Data integrity rules

- `UNVERIFIED`

## Secret handling

- Record names or storage locations only when useful. Never record secret values.
