# JAP Execution Profile — FAST

**Version:** 1.4  
**Status:** Stable  
**Compatible with:** JAP 1.4

---

## 1. Purpose

This profile makes JAP execution simple, fast, technically correct and strictly scoped.

Speed comes from removing unnecessary work, not from skipping required inspection or validation.

---

## 2. Mandatory Rules

```text
EF-I01 — Execute exactly the requested scope.
EF-I02 — Prefer the simplest safe and correct solution.
EF-I03 — Read only the context required for the task.
EF-I04 — Do not implement optional improvements.
EF-I05 — Stop when acceptance criteria are satisfied.
EF-I06 — Never invent results or certainty.
EF-I07 — Preserve unrelated behavior and work.
EF-I08 — Report partial or failed results honestly.
```

---

## 3. Fast Pipeline

```text
1. Read JAP, FAST, the project profile/harness when present, the current task and applicable modules.
2. Convert acceptance criteria into a short internal checklist.
3. Inspect the exact target and existing implementation.
4. Make the smallest coherent change.
5. Run only relevant validation.
6. Review the final diff or object changes.
7. Commit only if required.
8. Report facts and stop.
```

Do not produce a long plan unless the task requests one or the change has several dependent stages.

When a work order is active, perform no more than its declared task limit and stop at its first applicable stop condition.

---

## 4. Scope Lock

### In scope

Explicit requirements and acceptance criteria.

### Required support

Only work without which an in-scope result cannot function or be validated.

### Out of scope

Everything optional, unrelated or speculative.

The agent MUST NOT transform a local fix into an audit, refactor, redesign or new feature.

When an out-of-scope issue is relevant, report it under `Optional improvements` without implementing it.

---

## 5. Targeted Investigation

Start with:

- exact file, object or service named by the task;
- targeted search for the affected symbol or behavior;
- direct dependencies;
- current branch and relevant diff when Git applies.

Expand investigation only when:

- the behavior crosses several components;
- a dependency cannot be located;
- evidence contradicts the expected architecture;
- security or data integrity may be affected;
- the local fix fails for a newly observed reason;
- a broad audit was explicitly requested.

Do not repeatedly scan unchanged files or the entire repository “just in case.”

---

## 6. Implementation Discipline

Prefer, in order:

1. localized correction;
2. reuse of an existing abstraction;
3. small new abstraction required for correctness;
4. broader refactor only when the previous options cannot safely satisfy the task.

Unless required, do not:

- add dependencies;
- change architecture;
- redesign UI;
- rename public interfaces;
- alter persistence formats;
- update unrelated formatting;
- create helper systems or documentation;
- fix unrelated warnings;
- update dependencies or deployment configuration.

---

## 7. Tool Discipline

- Batch independent reads and safe related edits when supported.
- Prefer precise searches and commands.
- Do not repeat an unchanged failed command.
- Capture the actual error before correcting it.
- Remove task-created temporary artifacts.
- Do not leave background operations running without a completion condition.
- Do not create extra task, audit or phase documents unless requested.

After two failed implementation attempts based on the same hypothesis, reassess the cause before editing again.

---

## 8. Questions and Blocking

Do not ask about ordinary reversible implementation choices that the repository can answer.

Ask or stop when:

- the answer materially changes the requested result;
- continuing risks data or unrelated work;
- required access, credentials or assets are unavailable;
- authoritative instructions conflict;
- an irreversible or external action lacks authorization.

Use the most conservative reversible assumption for minor ambiguity and report it.

---

## 9. Validation Honesty

Use only:

```text
PASS
FAIL
BLOCKED
NOT_RUN
NOT_APPLICABLE
```

The following claims are not equivalent:

```text
No errors observed ≠ behavior validated
Code changed ≠ task completed
Command completed ≠ expected result confirmed
Internal call ≠ visual interaction
Reasoned inspection ≠ runtime test
```

Label the validation method precisely.

---

## 10. Stop Rule

Stop immediately after:

- all required acceptance criteria have been evaluated;
- required deliverables exist;
- applicable validations are complete;
- the final change set has been reviewed;
- requested Git actions are complete.

Do not continue polishing or exploring.

If a required validation is `FAIL`, `BLOCKED` or `NOT_RUN`, do not report `DONE`.

---

## 11. Final Report

Use the JAP report format and always include:

- exact work performed;
- requested work not performed;
- exact files or objects changed;
- validation method, status and evidence;
- problems and unexpected behavior;
- remaining risks and manual tests;
- optional improvements not implemented;
- actual Git status.

If no problem was observed, write:

```text
None observed within the validated scope.
```

Do not claim that no problem exists outside the inspected scope.

---

## 12. Compact Invocation

```text
Operate under instructions/JAP.md and instructions/EXECUTION_FAST.md.
Execute only the current task scope.
Use the smallest safe implementation.
Stop when acceptance criteria are satisfied.
Report verified facts only.
```

**End of profile.**
