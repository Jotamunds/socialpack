---
profile_version: "1.0"
project_type: "roblox-studio"
status: "bootstrap_required"
project_name: "UNSET"
primary_harness: "instructions/harnesses/ROBLOX_STUDIO_HARNESS.md"
additional_harnesses: []

execution:
  task_source: "WORK_ORDER.md"
  state_file: "PROJECT_STATE.md"
  state_tracking: true
  default_autonomy: "standard"

target:
  studio_instance: "DETECT"
  experience_name: "DETECT"
  place_name: "DETECT"
  place_id: "DETECT"

source:
  authority: "DETECT"
  repository_root: "."
  rojo_project: "DETECT"
  sync_direction: "DETECT"

architecture:
  server: "DETECT"
  client: "DETECT"
  shared: "DETECT"
  remotes: "DETECT"
  persistence: "DETECT"
  service_pattern: "DETECT"

commands:
  sync: "DETECT"
  build: "DETECT"
  lint: "DETECT"
  format: "DETECT"
  typecheck: "DETECT"
  test: "DETECT"

validation:
  automated_tests: "DETECT"
  internal_luau: "DETECT"
  visual_playtest: "DETECT"
  real_input_available: "DETECT"
  multi_client_available: "DETECT"
  persistence_test_environment: "DETECT"

permissions:
  edit_repository: true
  edit_studio: "DETECT"
  sync_to_studio: false
  operate_test_data: false
  operate_production_data: false
  commit: false
  push: false
  publish: false
  change_monetization: false
  change_live_configuration: false

protected_systems: []
known_constraints: []
---

# Roblox Studio Project Profile

This file stores stable experience facts. During bootstrap, replace `DETECT` only with observed values. Source authority must be explicit before edits that could be overwritten.

## Game boundaries

- Core player loop: `UNSET`
- Supported devices: `UNSET`
- Multiplayer model: `UNSET`
- Explicit non-goals: `UNSET`

## Remote and trust boundaries

- `DETECT`

## Persistence notes

- `DETECT`
- Never place secrets, live player data or private identifiers in this file.
