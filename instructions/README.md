# JAP Instructions Package

**Version:** 1.4

Reusable instructions for AI-assisted technical work.

The package is designed to keep agents fast and honest: a small universal core is always loaded, while domain modules are loaded only when the current task requires them.

## Installation

For a generic project, copy both of these items to the project root:

```text
AGENTS.md
instructions/
```

Keep the current task in a separate project file, preferably under `tasks/`.

For a reusable project setup, follow `harnesses/README.md` and copy the selected harness files to the project root. The harness stores stable project context, an executable work queue and verified project state so later requests can be short.

## Default loading order

```text
1. AGENTS.md
2. instructions/JAP.md
3. instructions/EXECUTION_FAST.md
4. PROJECT_PROFILE.md and its selected harness, when present
5. Current task or active WORK_ORDER.md entries
6. Only the applicable modules
```

Do not preload every harness or module.

## Structure

```text
instructions/
├── JAP.md
├── EXECUTION_FAST.md
├── TASK_TEMPLATE.md
├── harnesses/
│   ├── SITES_HARNESS.md
│   ├── ROBLOX_STUDIO_HARNESS.md
│   ├── BACKEND_DATA_HARNESS.md
│   ├── SECURITY_AUTH_HARNESS.md
│   ├── RELEASE_DEPLOYMENT_HARNESS.md
│   └── QUALITY_HARNESS.md
└── modules/
    ├── roblox/
    │   ├── ROBLOX_STUDIO.md
    │   └── ROBLOX_SECURITY_STANDARD.md
    ├── ui/
    │   └── LIQUID_GLASS_IMPLEMENTATION.md
    └── apple/
        ├── README.md
        ├── SKILLS_INDEX.md
        └── skills/
            └── 20 selected Apple skills

harnesses/
├── README.md
├── sites/
├── roblox-studio/
├── backend-data/
├── security-auth/
├── release-deployment/
└── quality/

Each harness directory contains:

AGENTS.md
PROJECT_PROFILE.md
WORK_ORDER.md
PROJECT_STATE.md
```

## Reusable harness workflow

Initialize once:

```text
Inicialize o harness deste projeto.
```

Then use short requests:

```text
Execute a próxima tarefa READY.
Execute as tarefas READY permitidas pelo WORK_ORDER.md.
Continue a tarefa IN_PROGRESS.
```

The work order never authorizes invented tasks. Batch execution remains limited by `max_tasks_per_run` and configured stop conditions.

Harnesses are combinable. Keep one primary profile and add only the additional harness paths needed by the project or current task. Do not preload all six.

## Creating a task

1. Copy `instructions/TASK_TEMPLATE.md` into the project's task directory.
2. Replace placeholders with one concrete objective.
3. Mark in-scope, out-of-scope and required validation explicitly.
4. Reference only the modules that apply.
5. Invoke the task by ID.

Example:

```text
Execute TASK-ID under JAP using the referenced profile and modules.
Do exactly the defined scope.
Stop when the acceptance criteria are satisfied.
Return the required Agent Report with verified facts only.
```

## Apple skills

The package contains 20 selected skills for general Apple development. Load only the skill or smallest skill set required by the current task. See `instructions/modules/apple/SKILLS_INDEX.md`.
