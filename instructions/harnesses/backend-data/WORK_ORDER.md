---
work_order_version: "1.0"
status: "template"
execution_mode: "single"
max_tasks_per_run: 1
stop_on:
  - "FAIL"
  - "BLOCKED"
  - "manual_gate"
  - "data_operation_gate"
  - "external_action_gate"
update_project_state: true
---

# Backend and Data Work Order

No task is executable while `status` is `template`. Set it to `active` and mark concrete entries `READY`.

## Active tasks

<!--
### API-001 — Short objective

- Status: READY
- Depends on: NONE
- Objective: One observable backend/data outcome.
- In scope: Exact requested work.
- Out of scope: Explicit exclusions.
- Target: Endpoint/service/model/query or targeted discovery.
- Contract authority: Use `PROJECT_PROFILE.md`.
- Schema authority: Use `PROJECT_PROFILE.md`.
- Requirements:
  - API-001-R01 — Testable requirement.
- Acceptance:
  - API-001-A01 — Observable evidence.
- Validation:
  - API-001-V01 — `ST`, `UT`, `CT`, `IN`, `DB`, `JB` or `MU`; environment and evidence.
- Data actions: NONE
- External actions: NONE
-->

## In progress

- NONE

## Blocked

- NONE

## Completed

- NONE

## Queue rules

- Execute in listed order unless dependencies require otherwise.
- Do not execute `DRAFT`, `BLOCKED`, `DONE` or commented entries.
- Do not create new tasks.
- Mark `DONE` only when every required criterion is `PASS` or `NOT_APPLICABLE`.
- Record exact migration, environment and data-operation state.
