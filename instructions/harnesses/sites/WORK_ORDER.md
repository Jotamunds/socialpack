---
work_order_version: "1.0"
status: "template"
execution_mode: "single"
max_tasks_per_run: 1
stop_on:
  - "FAIL"
  - "BLOCKED"
  - "manual_gate"
  - "external_action_gate"
update_project_state: true
---

# Site Work Order

No task is executable while `status` is `template`.

Set the work order to `active`, add concrete task entries under `Active tasks`, and mark executable entries `READY`.

## Active tasks

<!-- Add concrete tasks here. Do not execute this commented example.

### SITE-001 — Short objective

- Status: READY
- Depends on: NONE
- Objective: One observable outcome.
- In scope: Exact requested work.
- Out of scope: Related work that must not be implemented.
- Target: Known route/component or `determine by targeted inspection`.
- Requirements:
  - SITE-001-R01 — Testable requirement.
- Acceptance:
  - SITE-001-A01 — Observable completion evidence.
- Validation:
  - SITE-001-V01 — Method and required evidence.
- External actions: NONE

-->

## In progress

- NONE

## Blocked

- NONE

## Completed

- NONE

## Queue rules

- Execute tasks in listed order unless dependencies require otherwise.
- Do not execute `DRAFT`, `BLOCKED`, `DONE` or commented tasks.
- Do not create new tasks.
- Mark a task `DONE` only when every required acceptance criterion is `PASS` or `NOT_APPLICABLE`.
- Use `PARTIAL`, `FAILED` or `BLOCKED` truthfully and record the exact remaining work.
