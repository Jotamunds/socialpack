# JAP Harness — Sites

**Version:** 1.0  
**Status:** Stable  
**Requires:** `instructions/JAP.md`, `instructions/EXECUTION_FAST.md`

---

## 1. Activation

Load this harness for websites, web applications, landing pages, dashboards, portals and browser-delivered interfaces.

Use `PROJECT_PROFILE.md` as the project source of truth for stack, commands, routes, design constraints and external-action permissions.

---

## 2. Required project files

```text
PROJECT_PROFILE.md — stable project facts and permissions
WORK_ORDER.md      — explicit executable task queue
PROJECT_STATE.md   — concise current state and verified history
```

Missing files do not authorize the agent to invent product decisions. For a direct user task, execute the task with targeted inspection and create no harness files unless requested.

---

## 3. Bootstrap

When the profile is `bootstrap_required`:

1. inspect package metadata, repository structure and existing configuration;
2. fill only facts that can be verified;
3. preserve `UNSET` for product decisions that cannot be inferred safely;
4. test or verify declared commands before marking them `VERIFIED`;
5. do not redesign, upgrade dependencies, deploy or implement product features during bootstrap;
6. set profile status to `ready` only when the minimum execution facts are known.

Minimum execution facts:

- source-of-truth directory;
- runtime, framework and package manager when applicable;
- install, development, test, lint/typecheck and build commands that exist;
- route and component locations;
- styling or design-system authority;
- Git, push and deployment permissions.

Ask only when an unknown value materially changes the result or authorization.

---

## 4. Work-order execution

Execute only entries marked `READY`.

### Single mode

Execute the first unblocked `READY` task, then report and stop.

### Batch mode

Execute ready tasks in declared order up to `max_tasks_per_run`. After each task:

1. validate its acceptance criteria;
2. update its factual status;
3. update only affected fields in `PROJECT_STATE.md`;
4. stop on the first configured failure, blocker, manual gate or external-action gate.

Do not combine unrelated tasks into a refactor. Do not create new queue items. Suggested work belongs only in the final report.

---

## 5. Targeted inspection

Use this order:

```text
1. Project profile and active task
2. Named route, component, service or configuration
3. Direct imports, callers and tests
4. Relevant runtime/build configuration
5. Broader repository inspection only when evidence requires it
```

Prefer existing conventions, components, tokens and utilities. Do not replace a functioning stack or design system because another option is preferred.

---

## 6. Implementation boundaries

Unless the task requires it, do not:

- add or upgrade dependencies;
- change framework, package manager or rendering model;
- redesign unrelated pages or components;
- create speculative pages, APIs, analytics or content;
- modify authentication, database schema or persistent data;
- change environment variables, domains, access rules or billing;
- deploy, publish or push;
- weaken security, accessibility or type safety to make a check pass.

Use responsive behavior and existing design tokens when the task affects UI.

---

## 7. Validation categories

| Code | Category | Proves | Does not prove |
|---|---|---|---|
| `ST` | Static | Lint, types or static rules ran | Runtime or visual behavior |
| `UT` | Automated test | Assertions actually ran and passed | Browser integration unless exercised |
| `BD` | Build | The configured production build completed | Correct runtime behavior after deployment |
| `BR` | Browser behavior | A real browser flow was performed and observed | Unvisited routes or states |
| `VS` | Visual | Relevant viewport/state was visually inspected | Functional correctness not exercised |
| `AX` | Accessibility | The stated automated or manual accessibility check ran | Complete accessibility compliance |
| `IN` | Integration/E2E | The stated integrated path ran | Systems and paths not exercised |
| `MU` | User manual | A check was assigned to the user | A passing result before user confirmation |

Every `PASS` must name the command, browser action, viewport, assertion or observed result.

Never claim:

- responsive validation from one viewport;
- visual correctness from source inspection;
- browser validation from build output;
- accessibility compliance from one automated scan;
- production correctness from a local test;
- successful deployment without observing the deployment result.

---

## 8. Minimum validation selection

Choose checks based on the changed behavior, not a fixed ceremony.

| Change | Minimum relevant evidence |
|---|---|
| Pure utility or server logic | Targeted `UT`, plus `ST` when configured |
| Component behavior | Targeted `UT` or `BR`; `VS` when appearance changes |
| Responsive layout | `VS` at declared relevant breakpoints; interaction via `BR` when applicable |
| Route or navigation | `BR` for the affected path and failure/empty state when relevant |
| Build/configuration | `BD`, plus the directly affected runtime check |
| Form, auth or data mutation | `IN` or `BR` with success and relevant failure behavior; never use real sensitive data unnecessarily |
| Metadata/SEO | Inspect generated document or route output; use `BR` when runtime-generated |
| Accessibility change | Targeted `AX` plus keyboard/focus observation when interaction changed |

Run the smallest sufficient set. If tooling is unavailable, report the exact `NOT_RUN` check and manual steps.

---

## 9. Browser and visual rules

- Use the browser target and breakpoints declared in the profile.
- Verify the exact route and state changed.
- Do not call a page pixel-perfect without a reference and direct comparison.
- Do not use placeholder content or generated assets unless the task allows them.
- Record console/runtime errors relevant to the tested flow.
- Stop development servers started by the agent unless the environment requires them to remain active and the report says so.

---

## 10. Security and data

- Keep secrets in approved environment storage, never source or reports.
- Treat URL parameters, forms, cookies, API responses and uploaded content as untrusted.
- Preserve server-side authorization; client-side hiding is not access control.
- Do not run production migrations, destructive seed/reset commands or real transactions without explicit authorization.
- For authentication, payments, personal data or permissions, validate the relevant denial/failure path when safely possible.

---

## 11. External actions

`commit`, `push`, `deploy`, domain changes, access changes, production environment changes and migrations each require the permission declared in the active task or project profile.

Permission for one action does not imply permission for another.

---

## 12. Definition of done

A site task is complete only when:

- its explicit requirements are implemented;
- each required acceptance criterion has a status and evidence;
- relevant validation ran or is truthfully marked otherwise;
- no unrelated changes or temporary artifacts remain;
- work-order and project-state updates are factual, when enabled;
- external actions match authorization;
- the JAP Agent Report is returned.

**End of harness.**
