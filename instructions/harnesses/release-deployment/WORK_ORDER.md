---
work_order_version: "1.0"
status: "template"
execution_mode: "single"
max_tasks_per_run: 1
stop_on:
  - "FAIL"
  - "BLOCKED"
  - "validation_gate"
  - "approval_gate"
  - "artifact_mismatch"
  - "unhealthy_deployment"
  - "rollback_gate"
update_project_state: true
---

# Release and Deployment Work Order

No task is executable while `status` is `template`. Set it to `active` and mark concrete entries `READY`.

## Active tasks

<!--
### REL-001 — Short objective

- Status: READY
- Depends on: NONE
- Objective: One exact release/deployment outcome.
- Source branch/revision: Observe; never invent.
- Target environment: preview / staging / production.
- In scope: Exact authorized stages.
- Out of scope: Explicit exclusions.
- Requirements:
  - REL-001-R01 — Testable requirement.
- Acceptance:
  - REL-001-A01 — Observable terminal result.
- Validation:
  - REL-001-V01 — `CI`, `BD`, `AR`, `DP`, `SM`, `RB` or `MU`.
- Authorized actions: Exact subset of commit/push/tag/release/deploy/config/migrate/rollback.
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
- Do not create tasks or infer external authorization.
- Mark `DONE` only when required terminal results and health checks pass.
- Record exact revision, artifact, target and final deployment state.
