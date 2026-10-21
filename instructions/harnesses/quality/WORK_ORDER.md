---
work_order_version: "1.0"
status: "template"
execution_mode: "single"
max_tasks_per_run: 1
stop_on:
  - "FAIL"
  - "BLOCKED"
  - "environment_gate"
  - "test_data_gate"
  - "baseline_update_gate"
  - "load_test_gate"
  - "manual_gate"
update_project_state: true
---

# Quality Work Order

No task is executable while `status` is `template`. Set it to `active` and mark concrete entries `READY`.

## Active tasks

<!--
### QA-001 — Short objective

- Status: READY
- Depends on: NONE
- Objective: One measurable quality outcome.
- Risk surface: Exact flows/components affected.
- In scope: Exact validation or correction.
- Out of scope: Explicit exclusions.
- Environments: Exact test targets.
- Requirements:
  - QA-001-R01 — Testable requirement.
- Acceptance:
  - QA-001-A01 — Observable evidence or threshold.
- Validation:
  - QA-001-V01 — `ST`, `UT`, `IN`, `E2`, `BR`, `VS`, `AX`, `PF` or `MU`.
- Baseline/test-data actions: NONE
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
- Do not create tasks or broaden the declared coverage target.
- Mark `DONE` only when every required criterion is `PASS` or `NOT_APPLICABLE`.
- Record exact environment, method, result and untested scope.
