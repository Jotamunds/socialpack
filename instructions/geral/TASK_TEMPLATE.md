# JAP Task Template

Copy this file for one atomic task. Delete unused optional sections instead of leaving placeholders.

```md
---
jap: "1.4"
id: "PROJECT-001"
type: "implementation"
priority: "medium"
autonomy: "standard"
execution_profile: "instructions/EXECUTION_FAST.md"
modules: []
phase: null
depends_on: []
commit: false
push: false
---

# Task: Short objective name

## Objective

State one concrete result in one or two sentences.

## Context

- Current behavior.
- Directly relevant component, file, service or object.
- Confirmed constraints.

## Scope

### In scope

- Exact requested change.

### Required supporting work

- Known required support, or `Determine through targeted inspection.`

### Out of scope

- Related feature, refactor or redesign that must not be implemented.

## Requirements

`PROJECT-001-R01`  
Observable or technically verifiable requirement.

`PROJECT-001-R02`  
Another requirement.

## Acceptance criteria

`PROJECT-001-A01`  
Exact evidence required for completion.

`PROJECT-001-A02`  
Expected behavior, including relevant failure behavior.

## Constraints

- Preserve unrelated behavior.
- Use current architecture and dependencies.
- Do not implement optional improvements.
- Add task-specific security or compatibility constraints.

## Target files or objects

- `known/path/or/object`
- `Determine through targeted search` when unknown.

## Validation

| ID | Check | Method | Required |
|---|---|---|---|
| `PROJECT-001-V01` | Exact behavior | automated / static / build / internal / runtime / visual / manual | Yes |
| `PROJECT-001-V02` | Relevant regression | appropriate method | Yes |

## Deliverables

- Exact code, file, object or configuration requested.

## Git

- Commit: required / not required
- Push: authorized / not authorized
- Suggested message: `type(scope): summary`
```

## Module references

Use only applicable module paths in front matter:

```yaml
modules:
  - "instructions/modules/roblox/ROBLOX_STUDIO.md"
  - "instructions/modules/roblox/ROBLOX_SECURITY_STANDARD.md"
  - "instructions/modules/ui/LIQUID_GLASS_IMPLEMENTATION.md"
```

Do not include the Roblox security module for an unrelated visual-only change.

When project harnesses are installed, they are selected by `PROJECT_PROFILE.md` and do not need to be repeated in every task. Valid harness paths are:

```text
instructions/harnesses/SITES_HARNESS.md
instructions/harnesses/ROBLOX_STUDIO_HARNESS.md
instructions/harnesses/BACKEND_DATA_HARNESS.md
instructions/harnesses/SECURITY_AUTH_HARNESS.md
instructions/harnesses/RELEASE_DEPLOYMENT_HARNESS.md
instructions/harnesses/QUALITY_HARNESS.md
```

For Apple tasks, reference the exact selected skill instead of the entire Apple directory:

```yaml
modules:
  - "instructions/modules/apple/skills/swiftui-patterns/SKILL.md"
  - "instructions/modules/apple/skills/swift-testing/SKILL.md"
```

Use `instructions/modules/apple/SKILLS_INDEX.md` to choose the smallest applicable set.

## Roblox task addendum

```md
## Roblox Studio target

- Studio instance: `exact name`
- Experience/place: `exact name`
- Place ID: `exact ID or unknown`
- Authoritative source: repository / Rojo / Studio DataModel / determine before editing

## Roblox validation matrix

| ID | Behavior | Category | Required evidence |
|---|---|---|---|
| `PROJECT-001-V01` | Logic | `AT` or `LI` | Exact assertion or state transition |
| `PROJECT-001-V02` | UI/gameplay | `PV` | Real action and observed result |
| `PROJECT-001-V03` | User-only check | `MU` | Steps and expected result if not executed |

## Roblox exclusions

- Do not create unrelated Instances, scripts, GUIs or remotes.
- Do not change maps, terrain, characters or visual design unless requested.
- Do not call internal Luau execution a visual Playtest.
- Do not publish the experience.
```

## Task quality checklist

```text
[ ] One clear objective
[ ] Explicit in-scope and out-of-scope items
[ ] Testable requirements
[ ] Observable acceptance criteria
[ ] Correct validation categories
[ ] Destructive or external actions identified
[ ] Commit and push authorization defined
[ ] No optional improvement disguised as a requirement
[ ] Only applicable modules referenced
```

## Invocation

```text
Execute TASK-ID under JAP using its referenced profile and modules.
Do exactly the defined scope.
Stop when acceptance criteria are satisfied.
Return the required Agent Report with verified facts only.
```

**End of template.**
