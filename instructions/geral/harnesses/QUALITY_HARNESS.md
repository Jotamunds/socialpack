# JAP Harness — QA, Accessibility and Performance

**Version:** 1.0  
**Status:** Stable  
**Requires:** `instructions/JAP.md`, `instructions/EXECUTION_FAST.md`

---

## 1. Activation

Load this harness for test strategy, regression verification, accessibility, browser/device coverage, visual quality and performance measurement.

This harness chooses evidence according to the changed risk. It does not require every test category for every task.

---

## 2. Bootstrap

When the profile is `bootstrap_required`:

1. identify product surfaces and critical user flows;
2. discover existing unit, integration, end-to-end and visual tools;
3. record supported browsers, devices, viewports and assistive-technology targets;
4. record explicit accessibility standards and performance budgets;
5. identify approved test-data and environment sources;
6. verify safe commands before marking them `VERIFIED`;
7. do not update snapshots, baselines or thresholds during bootstrap.

Do not invent budgets or compliance targets. Use `UNSET` until the project defines them.

---

## 3. Risk-based selection

For each acceptance criterion:

1. identify the behavior and likely regression surface;
2. select the smallest validation method that can actually prove it;
3. include relevant success, failure, empty, loading and boundary states;
4. use real browser/device or integration evidence only when required;
5. report untestable criteria as `NOT_RUN` or `BLOCKED` with exact reason.

Do not run a full suite only for ceremony. Run broader regression checks when the change crosses shared infrastructure, critical flows or many consumers.

---

## 4. Work-order execution

Execute only `READY` entries under `single` or bounded `batch` mode.

Stop on configured failure, blocker, unavailable required environment, destructive test-data gate, baseline-update gate, load-test gate or manual gate. Never alter product code merely to hide a failing test.

---

## 5. Validation categories

| Code | Category | Minimum evidence |
|---|---|---|
| `ST` | Static | Named lint, type or static command and result |
| `UT` | Unit/component | Assertions actually ran and passed |
| `IN` | Integration | Named components interacted in a controlled environment |
| `E2` | End-to-end | Critical flow completed through its real interface |
| `BR` | Browser/device | Exact browser/device, viewport and observed behavior |
| `VS` | Visual | Exact screen/state compared or inspected |
| `AX` | Accessibility | Named automated/manual method and affected criteria |
| `PF` | Performance | Tool, environment, scenario and measured values |
| `MU` | User manual | Exact pending steps; not passed until confirmation |

Passing one category does not imply another.

---

## 6. Accessibility rules

- Prefer semantic structure and native controls.
- Validate keyboard operation and visible focus when interaction changes.
- Check accessible names, labels, errors and state announcements when applicable.
- Evaluate contrast, zoom/reflow and motion preferences for affected UI.
- Automated scans find only part of accessibility problems.
- Do not claim legal or standards compliance from a limited test.

---

## 7. Visual and responsive rules

- Name the exact screen, state, viewport and reference.
- Visual inspection without a reference may establish obvious layout behavior, not pixel accuracy.
- Do not approve responsive behavior from one viewport.
- Snapshot updates require verifying that the new result is intended; never update snapshots only to make tests pass.
- Report missing assets, fonts, animation limitations and rendering differences.

---

## 8. Performance rules

- Use the explicit project budget when one exists.
- Record environment, dataset, warm/cold state, sample count and tool when they affect interpretation.
- Compare equivalent scenarios.
- Do not claim production performance from an unrepresentative local run.
- Load tests require authorized targets and limits.
- Never degrade correctness, accessibility or security to improve a metric without task authorization.

---

## 9. Failure classification

Classify relevant failures as:

```text
TASK_INTRODUCED
PRE_EXISTING
FLAKY_OR_NONDETERMINISTIC
ENVIRONMENTAL
UNKNOWN_ORIGIN
```

Capture evidence before retrying. Do not hide an earlier failure when a rerun passes; report flakiness or the corrective change.

---

## 10. Forbidden claims

Do not claim:

- complete coverage because a suite passed;
- accessibility compliance from an automated scan;
- visual correctness from source inspection;
- cross-browser support from one browser;
- performance improvement without comparable measurements;
- manual testing completed when only an internal call ran;
- no regression outside the validated scope.

---

## 11. Definition of done

A quality task is complete only when:

- required criteria map to appropriate validation categories;
- environment, method, result and evidence are recorded;
- relevant failures are classified honestly;
- baselines, snapshots and test data changed only when authorized;
- untested browsers, devices, flows or assistive technologies are listed;
- the JAP Agent Report separates passed checks from pending manual work.

**End of harness.**
