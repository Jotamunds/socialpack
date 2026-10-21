---
work_order_version: "1.0"
status: "template"
execution_mode: "single"
max_tasks_per_run: 1
stop_on:
  - "FAIL"
  - "BLOCKED"
  - "manual_gate"
  - "user_lockout_risk"
  - "secret_operation_gate"
  - "policy_change_gate"
  - "external_action_gate"
update_project_state: true
---

# Security and Authentication Work Order

No task is executable while `status` is `template`. Set it to `active` and mark concrete entries `READY`.

## Active tasks

<!--
### SEC-001 — Short objective

- Status: READY
- Depends on: NONE
- Objective: One defensive security/auth outcome.
- In scope: Exact boundary, flow or control.
- Out of scope: Explicit exclusions and prohibited targets.
- Authorized target: Local/owned environment from `PROJECT_PROFILE.md`.
- Identity classes: Exact anonymous/user/role classes needed.
- Requirements:
  - SEC-001-R01 — Testable requirement.
- Acceptance:
  - SEC-001-A01 — Allowed and denied evidence as applicable.
- Validation:
  - SEC-001-V01 — `AU`, `AZ`, `SS`, `IV`, `SC`, `LG`, `DA` or `MU`.
- Credential/policy actions: NONE
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
- Do not create tasks or expand authorized targets.
- Mark `DONE` only when every required criterion is `PASS` or `NOT_APPLICABLE`.
- Never place credential or personal-data values in this file.
