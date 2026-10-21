# JAP Harness — CI/CD, Releases and Deployment

**Version:** 1.0  
**Status:** Stable  
**Requires:** `instructions/JAP.md`, `instructions/EXECUTION_FAST.md`

---

## 1. Activation

Load this harness for pipelines, versioning, release preparation, artifacts, deployment, environment configuration, health checks and rollback.

Preparing, pushing, releasing, deploying and rolling back are distinct actions. Permission for one does not imply another.

---

## 2. Bootstrap

When the profile is `bootstrap_required`:

1. identify repository, branch strategy and protected branches;
2. identify CI provider, required checks and artifact authority;
3. map environments, deployment targets and approval gates;
4. record versioning, changelog and release conventions;
5. identify health checks and rollback mechanism;
6. verify read-only facts and safe local commands;
7. do not tag, push, deploy, modify environment values or trigger production jobs during bootstrap.

Set profile status to `ready` only when target environment and permissions cannot be confused.

---

## 3. Work-order execution

Execute only `READY` entries under `single` or bounded `batch` mode.

Each task must name the exact environment and authorized actions. Stop on validation failure, dirty or unexpected source state, missing approval, artifact mismatch, unhealthy deployment, rollback gate or external-action gate.

Do not invent a version, release note, tag, target, approval or successful deployment.

---

## 4. Release pipeline

Use only applicable stages:

```text
PREFLIGHT
→ VALIDATE SOURCE
→ BUILD ARTIFACT
→ VERSION / CHANGELOG
→ COMMIT / PUSH / TAG IF AUTHORIZED
→ DEPLOY TO EXACT TARGET IF AUTHORIZED
→ HEALTH / SMOKE CHECK
→ ROLLBACK IF DEFINED AND AUTHORIZED
→ REPORT
```

A stage may be skipped only when not applicable or explicitly outside scope, and the report must say so.

---

## 5. Source and artifact integrity

- Confirm repository, branch, revision and working-tree state.
- Preserve unrelated uncommitted work.
- Build from the exact revision intended for release.
- Record artifact identity or checksum when the platform provides it.
- Do not rebuild a different artifact between validation and deployment without repeating relevant checks.
- Never place secrets inside release artifacts or logs.
- Do not bypass required CI checks or branch protection.

---

## 6. Environment and configuration rules

- Name the exact target: local, preview, test, staging or production.
- Treat environment variables, domains, access policies, certificates and infrastructure as separate protected changes.
- Never copy production secrets into local files.
- Validate required variable names without exposing values.
- Database migrations use both this harness and the backend/data harness.
- Access or authentication policy changes also use the security/auth harness.

---

## 7. Deployment and rollback

- Deployment permission must be `true` for the exact environment and requested by the active task.
- Observe the deployment result; starting a job is not successful deployment.
- Run the declared smoke or health checks after deployment.
- If health checks fail, stop further promotion.
- Roll back only when the mechanism, target and authorization are explicit.
- Report partial rollout, degraded state or rollback failure immediately and truthfully.

---

## 8. Validation categories

| Code | Category | Minimum evidence |
|---|---|---|
| `CI` | Pipeline | Named workflow/job and terminal result |
| `BD` | Build | Exact build command and artifact result |
| `AR` | Artifact | Revision and artifact identity verified |
| `DP` | Deployment | Exact environment, version and observed terminal result |
| `SM` | Smoke/health | Named endpoint or critical flow and observed result |
| `RB` | Rollback | Rollback mechanism actually exercised in the named environment |
| `MU` | Manual | Exact pending gate or check; not passed until confirmation |

Never claim:

- deployment success from a submitted job;
- production health from build success;
- rollback readiness from documentation alone;
- exact released revision without observing it;
- approval that was not received.

---

## 9. Permission model

Track separately:

```text
commit
push
tag
create_release
deploy_preview
deploy_staging
deploy_production
change_environment
change_domain_or_access
run_migrations
rollback
```

Production or irreversible actions require both persistent profile permission and an explicit active task naming the action and target. When both exist, do not ask repeatedly unless the observed target or risk differs.

---

## 10. Definition of done

A release/deployment task is complete only when:

- exact source revision, artifact and target are known;
- authorized stages completed with observed terminal results;
- required health checks were evaluated;
- skipped, failed and pending gates are reported;
- rollback state is factual;
- no secrets or unrelated changes were introduced;
- the JAP Agent Report includes version, environment and actual external actions.

**End of harness.**
