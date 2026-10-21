---
profile_version: "1.0"
project_type: "quality"
status: "bootstrap_required"
project_name: "UNSET"
source_of_truth: "repository"
primary_harness: "instructions/harnesses/QUALITY_HARNESS.md"
additional_harnesses: []

execution:
  task_source: "WORK_ORDER.md"
  state_file: "PROJECT_STATE.md"
  state_tracking: true
  default_autonomy: "standard"

product:
  surfaces: "DETECT"
  critical_flows: "DETECT"
  supported_locales: "DETECT"

coverage_targets:
  browsers: []
  devices: []
  viewports: []
  operating_systems: []
  assistive_technologies: []

standards:
  accessibility: "UNSET"
  performance_budgets: "UNSET"
  browser_support_policy: "UNSET"
  visual_reference_authority: "DETECT"

commands:
  lint: "DETECT"
  typecheck: "DETECT"
  unit: "DETECT"
  integration: "DETECT"
  e2e: "DETECT"
  accessibility: "DETECT"
  performance: "DETECT"

test_context:
  environment: "DETECT"
  test_data_source: "DETECT"
  test_accounts: "DETECT"
  baseline_source: "DETECT"

permissions:
  edit_tests: true
  edit_product_code: false
  create_local_fixtures: true
  modify_shared_test_data: false
  update_snapshots: false
  update_visual_baselines: false
  change_thresholds_or_budgets: false
  run_load_tests: false
  run_tests_against_production: false
  install_dependencies: false
  commit: false
  push: false

known_constraints: []
---

# Quality Project Profile

Replace `DETECT` only with verified facts. Do not invent browsers, standards or performance budgets.

## Critical acceptance paths

- `UNVERIFIED`

## Known environment limitations

- `UNVERIFIED`

## Evidence retention

- Record concise paths or identifiers only. Never store credentials or personal test data here.
