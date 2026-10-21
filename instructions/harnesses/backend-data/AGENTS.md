# Backend and Data Project Bootstrap

Before executing work, read in order:

1. `instructions/JAP.md`
2. `instructions/EXECUTION_FAST.md`
3. `PROJECT_PROFILE.md`
4. `instructions/harnesses/BACKEND_DATA_HARNESS.md`
5. the direct task or active `WORK_ORDER.md` entries
6. only additional harnesses/modules selected by the profile or task

During bootstrap, identify API and schema authorities without applying migrations or touching production data.

Execute only explicit scope. For a work order, run only `READY` tasks under its mode, limit and stop conditions. Update task status and `PROJECT_STATE.md` with verified facts only.

Do not add dependencies, apply migrations, modify shared/production data, change secrets, commit, push or deploy unless the profile and active task authorize the exact action and target.

Return the JAP Agent Report.
