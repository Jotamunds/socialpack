# Release and Deployment Project Bootstrap

Before executing work, read in order:

1. `instructions/JAP.md`
2. `instructions/EXECUTION_FAST.md`
3. `PROJECT_PROFILE.md`
4. `instructions/harnesses/RELEASE_DEPLOYMENT_HARNESS.md`
5. the direct task or active `WORK_ORDER.md` entries
6. only additional harnesses/modules selected by the profile or task

During bootstrap, inspect source, pipelines, environments and rollback paths without triggering external actions.

Execute only `READY` work under the configured mode, limit and gates. Update task status and `PROJECT_STATE.md` with observed results only.

Commit, push, tag, release, deployment, environment changes, migrations and rollback are separate permissions. Require profile permission plus an active task naming the exact action and target.

Return the JAP Agent Report with revision, artifact, environment and actual external actions.
