# JAP Module — Roblox Studio

**Version:** 1.1  
**Status:** Stable  
**Requires:** `instructions/JAP.md`, `instructions/EXECUTION_FAST.md`

---

## 1. Activation

Load this module only when a task inspects, edits or validates Roblox Studio, Luau, a DataModel object, a Roblox experience or a Studio-connected tool.

Load `ROBLOX_SECURITY_STANDARD.md` additionally when the task affects remotes, permissions, economy, inventory, persistence, physics authority, moderation or monetization.

---

## 2. Invariants

```text
RBX-I01 — Target only the requested Studio instance and experience.
RBX-I02 — Modify only task-related scripts, objects and properties.
RBX-I03 — Internal Luau execution is not real gameplay interaction.
RBX-I04 — Visual validation requires observed visual interaction.
RBX-I05 — Preserve the authoritative source and synchronization model.
RBX-I06 — Do not leave Studio in Play/Run after task-created validation.
RBX-I07 — Do not create unnecessary objects, scripts or placeholders.
RBX-I08 — Report exactly what was and was not validated.
```

---

## 3. Confirm the Target

Before editing, identify:

- exact Studio instance;
- experience/place name;
- `placeId`, when available;
- current mode: Edit, Play, Run or unavailable;
- exact scripts, services or objects involved;
- authoritative source: repository, Rojo, Studio DataModel or another defined system.

Do not edit another open Studio instance because it is easier to access.

Do not independently edit the same source in both the repository and Studio. Follow the project's synchronization authority.

If choosing the wrong source could overwrite or lose work, report `BLOCKED`.

---

## 4. Efficient Inspection

Use this order:

```text
1. Current Studio state
2. Known object/script path
3. Targeted hierarchy inspection
4. Targeted script read
5. Broader DataModel inspection only if the target cannot be found
```

Do not:

- repeatedly list every Studio instance;
- reread unchanged scripts without new evidence;
- scan the full DataModel for a localized task;
- start and stop Play without a validation purpose;
- inspect unrelated services for completeness;
- turn a specific correction into a general audit.

Batch compatible reads and edits when supported.

---

## 5. Implementation Rules

- Prefer localized edits over replacing whole scripts.
- Preserve existing names, paths, interfaces and behavior unless change is required.
- Inspect references before renaming, moving or deleting an Instance or script.
- Do not create `New`, `Fixed`, `Final` or similar duplicates.
- Do not create test parts, folders, remotes, GUIs or debug scripts unless required.
- Remove temporary logging, test objects and task-created debug data.
- Do not rebuild terrain, maps, characters or interfaces for a scripting correction.
- Do not change unrelated Instance properties.
- Do not publish the experience unless explicitly authorized.

---

## 6. Validation Categories

Every Roblox validation must use the correct category:

| Code | Category | Proves | Does not prove |
|---|---|---|---|
| `AT` | Automated test | Test assertions actually ran and passed | Visual quality or user interaction unless driven by the test |
| `LI` | Internal Luau | A function or state was exercised programmatically | Real UI input, visual Playtest or complete gameplay flow |
| `PV` | Visual/real Playtest | Required actions were performed through UI/gameplay and the result was observed | Unrelated or unexercised flows |
| `MU` | User manual test | A test is assigned to the user | Nothing has passed until the user reports the result |

Report static analysis, type checking, build/sync checks and source inspection separately.

### Forbidden claims

Do not claim:

- `PV PASS` after only `execute_luau` or another internal call;
- `PV PASS` after merely opening and closing Play;
- `PV PASS` from console output alone;
- `AT PASS` from source inspection only;
- `MU PASS` without the user performing and reporting the test;
- multiplayer validation from a single-client session;
- persistence validation without exercising a supported persistence path;
- visual correctness when no visual result was observed.

---

## 7. Real Playtest Requirements

Use `PV PASS` only when all applicable steps occurred:

1. Play or Run started successfully.
2. The relevant runtime state became ready.
3. The required action was performed through the real UI, control, prompt, character or gameplay route.
4. The expected visible or behavioral result was observed.
5. Relevant runtime errors were checked.
6. Play or Run was stopped after validation.

If tools can start Play but cannot perform or observe the action, report:

```text
MU — NOT_RUN
Reason: requires user-performed visual/gameplay interaction.
```

Never mutate internal state and relabel the result as a visual test.

---

## 8. Internal Luau

`LI` may be used for:

- inspecting Instance state;
- invoking deterministic module functions;
- checking server-side transitions;
- controlled test setup or cleanup;
- exercising logic that does not require real user input.

Report the exact function, state or invariant checked.

Internal Luau remains `LI` even when executed while Studio is in Play mode.

---

## 9. Validation Selection

| Behavior | Minimum useful evidence |
|---|---|
| Pure module calculation | Static/type check plus `AT` or `LI` |
| Server transaction | `AT` or `LI` with authoritative state evidence |
| Button or prompt | `PV`, or `MU NOT_RUN` when interaction cannot be driven |
| Animation or layout | `PV`, or `MU NOT_RUN` when visual observation is unavailable |
| DataStore persistence | Supported integration validation; otherwise `NOT_RUN` |
| Multiplayer synchronization | Multi-client/server test |

Passing one category does not satisfy another category automatically.

---

## 10. Failure and Permissions

On failure:

1. capture the exact error or unexpected state;
2. confirm target and Studio mode;
3. classify connection, permission, path, source, sync or runtime cause;
4. make one evidence-based correction;
5. retry the failed operation once.

Do not repeatedly reconnect, reopen Play or reapply the same edit without new evidence.

A permission request is not a successful action. Wait for the permission result and report denial or interruption accurately.

---

## 11. Completion Cleanup

Before reporting:

- stop Play/Run if the agent started it;
- remove temporary debug objects and safe task-created test data;
- inspect relevant runtime errors;
- verify final script/object state;
- inspect repository diff when repository files changed;
- commit only if requested;
- do not publish without authorization.

---

## 12. Report Addendum

```md
## Roblox target
- Studio instance: ...
- Experience/place: ...
- Place ID: ... | Unavailable
- Initial mode: ...
- Final mode: ...
- Authoritative source: ...

## Roblox changes
- Exact Instance and script paths.

## Roblox validation
| Check | Category | Status | Evidence |
|---|---|---|---|
| ... | AT / LI / PV / MU / static | PASS / FAIL / BLOCKED / NOT_RUN / NOT_APPLICABLE | ... |

## Manual tests still required
- Exact user action and expected result.
```

Do not write `None` under manual tests when required visual interaction was unavailable.

**End of module.**

