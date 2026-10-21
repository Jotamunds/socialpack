# Agent Bootstrap

Before executing a technical task, read:

1. `instructions/JAP.md`
2. `instructions/EXECUTION_FAST.md`
3. `PROJECT_PROFILE.md`, when present
4. the primary harness selected by `PROJECT_PROFILE.md`, when present
5. the current task document or the applicable `WORK_ORDER.md` entries
6. only additional harnesses and modules required by that task

## Harness activation

- Site or web project: `instructions/harnesses/SITES_HARNESS.md`
- Roblox project: `instructions/harnesses/ROBLOX_STUDIO_HARNESS.md`
- Backend, API, database, migration, queue or cache: `instructions/harnesses/BACKEND_DATA_HARNESS.md`
- Authentication, permissions, secrets or sensitive data: `instructions/harnesses/SECURITY_AUTH_HARNESS.md`
- CI/CD, release, artifact, deployment or rollback: `instructions/harnesses/RELEASE_DEPLOYMENT_HARNESS.md`
- QA, accessibility, visual/browser coverage or performance: `instructions/harnesses/QUALITY_HARNESS.md`

If a work order is active, execute only tasks marked `READY` and obey its execution mode, task limit and stop conditions. Never invent backlog work.

Do not preload every harness. Load the primary harness plus only the additional harnesses required by the current task.

## Module activation

- Roblox Studio, Luau, DataModel or Studio MCP: `instructions/modules/roblox/ROBLOX_STUDIO.md`
- Roblox security-sensitive networking, economy, persistence, permissions, physics or monetization: `instructions/modules/roblox/ROBLOX_SECURITY_STANDARD.md`
- Liquid Glass or glass-like UI implementation: `instructions/modules/ui/LIQUID_GLASS_IMPLEMENTATION.md`
- Apple/iOS/macOS/visionOS work: read `instructions/modules/apple/SKILLS_INDEX.md`, then load only the smallest applicable skill set under `instructions/modules/apple/skills/`

Do not preload unrelated modules.

Execute only the current task scope. Prefer the smallest safe implementation. Stop when the acceptance criteria are satisfied. Never claim an action or validation that did not occur.
