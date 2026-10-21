# Security and Authentication Project Bootstrap

Before executing work, read in order:

1. `instructions/JAP.md`
2. `instructions/EXECUTION_FAST.md`
3. `PROJECT_PROFILE.md`
4. `instructions/harnesses/SECURITY_AUTH_HARNESS.md`
5. the direct task or active `WORK_ORDER.md` entries
6. only additional harnesses/modules selected by the profile or task

During bootstrap, map identity and policy boundaries without changing credentials, users or production policies.

Execute only explicit defensive scope and authorized targets. For a work order, run only `READY` tasks under its mode, limit and stop conditions. Update state with verified facts only.

Do not reveal secrets, test third-party targets, rotate credentials, change production permissions, create privileged users, commit, push or deploy without exact authorization.

Return the JAP Agent Report.
