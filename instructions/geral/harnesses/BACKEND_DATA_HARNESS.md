# JAP Harness — Backend, APIs and Data

**Version:** 1.0  
**Status:** Stable  
**Requires:** `instructions/JAP.md`, `instructions/EXECUTION_FAST.md`

---

## 1. Activation

Load this harness for server logic, APIs, databases, migrations, queues, caches, integrations and persistent data.

Use `PROJECT_PROFILE.md` as the source of truth for runtime, contracts, schema authority, commands, environments and data-operation permissions.

---

## 2. Bootstrap

When the profile is `bootstrap_required`:

1. inspect package metadata, server entrypoints and configuration;
2. identify API and database schema authorities;
3. map request flow, service boundaries and persistence access;
4. identify existing test, build and migration commands;
5. record environments without reading or copying secret values;
6. verify commands safely before marking them `VERIFIED`;
7. do not apply migrations, mutate production data or implement features during bootstrap.

Leave product decisions as `UNSET`. Ask only when an unknown affects correctness, compatibility, data integrity or authorization.

---

## 3. Work-order execution

Execute only entries marked `READY`.

- `single`: execute the first unblocked ready task and stop.
- `batch`: execute in order up to `max_tasks_per_run`.

After each attempted task, record factual status and evidence. Stop on configured failure, blocker, manual gate, data-operation gate or external-action gate. Never create backlog work.

---

## 4. Backend invariants

```text
BE-I01 — Preserve public contracts unless a coordinated change is required.
BE-I02 — Validate untrusted input at the authoritative boundary.
BE-I03 — Enforce authorization on the server, not only the client.
BE-I04 — Preserve data integrity across partial failures.
BE-I05 — Use transactions or idempotency when the operation requires them.
BE-I06 — Do not expose secrets or sensitive data in responses or logs.
BE-I07 — Do not operate on production data without exact authorization.
BE-I08 — Do not claim compatibility or migration safety without evidence.
```

---

## 5. Targeted inspection

Use this order:

```text
1. Project profile and active task
2. Named endpoint, service, model, query or job
3. Direct callers, contracts and tests
4. Relevant schema, migration and configuration
5. Broader architecture only when evidence requires it
```

Follow the existing layering and dependency direction. Do not introduce a repository, service, event system or abstraction unless the task requires it.

---

## 6. API and integration rules

- Preserve documented status codes, response shapes and error semantics.
- Validate type, size, range and ownership of external input.
- Handle timeouts, retryable failures and duplicate delivery only where applicable.
- Do not retry non-idempotent operations blindly.
- Keep external-service credentials and raw sensitive payloads out of logs.
- Use contract changes that remain backward compatible unless breaking change is explicitly authorized.
- Do not call a mocked integration an end-to-end production validation.

---

## 7. Database and migration rules

- Identify the schema authority before changing models or migrations.
- Prefer additive, backward-compatible changes for live systems.
- Separate creating a migration file from applying it.
- Never run destructive reset, drop, truncate or broad delete commands without exact target authorization.
- Inspect affected constraints, indexes, defaults and nullability.
- Define rollback or forward-recovery behavior for releases when applicable.
- Use synthetic or approved test data; do not copy production personal data into development.
- Report whether migration validation was static, local, staging or production.

---

## 8. Validation categories

| Code | Category | Minimum evidence |
|---|---|---|
| `ST` | Static | Exact lint/type/static command and result |
| `UT` | Unit | Assertions for isolated logic actually ran |
| `CT` | Contract | Request/response or message contract exercised |
| `IN` | Integration | Real configured components interacted in a controlled environment |
| `DB` | Database | Schema/query/migration behavior exercised on the named environment |
| `JB` | Job/queue | Delivery, retry or idempotency behavior exercised |
| `MU` | Manual | Exact pending steps; not passed until user confirmation |

Select only relevant categories. Every `PASS` must state the environment and evidence.

Never claim:

- production safety from local tests;
- migration success from generating a migration file;
- integration success when dependencies were mocked;
- rollback readiness when rollback was neither defined nor tested;
- no data loss without exercising or proving the relevant path.

---

## 9. External and data actions

Creating migration files, applying migrations, seeding, modifying shared data, operating production data, changing secrets, calling paid services, committing, pushing and deploying are separate permissions.

Profile permission and an explicit active task are both required for production or irreversible actions.

---

## 10. Definition of done

A backend/data task is complete only when:

- the correct contract and schema authorities were used;
- requirements and relevant failure behavior are implemented;
- required validation has status, environment and evidence;
- data compatibility and migration state are reported truthfully;
- no secrets, unsafe debug output or unrelated changes remain;
- work-order and project-state entries are factual, when enabled;
- external and data actions match authorization;
- the JAP Agent Report is returned.

**End of harness.**
