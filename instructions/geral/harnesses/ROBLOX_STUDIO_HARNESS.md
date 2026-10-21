# JAP Harness — Roblox Studio Projects

**Version:** 1.0  
**Status:** Stable  
**Requires:** `instructions/JAP.md`, `instructions/EXECUTION_FAST.md`, `instructions/modules/roblox/ROBLOX_STUDIO.md`

---

## 1. Activation

Load this harness for persistent development of a Roblox experience or Roblox Studio project.

Always load `ROBLOX_STUDIO.md`. Load `ROBLOX_SECURITY_STANDARD.md` when the task affects remotes, permissions, economy, inventory, persistence, physics authority, moderation or monetization.

Use `PROJECT_PROFILE.md` as the source of truth for the experience target, synchronization authority, architecture, commands, validation capabilities and publishing permissions.

---

## 2. Required project files

```text
PROJECT_PROFILE.md — stable experience facts and permissions
WORK_ORDER.md      — explicit executable task queue
PROJECT_STATE.md   — concise current state and verified history
```

The Roblox module owns Studio validation definitions. This harness adds reusable project configuration, queue execution and continuity rules.

---

## 3. Bootstrap

When the profile is `bootstrap_required`:

1. inspect repository configuration and only the relevant Studio target when available;
2. identify the authoritative source: repository/Rojo, Studio DataModel or another declared system;
3. record experience/place identifiers only when observed;
4. map client, server and shared source locations;
5. identify existing lint, format, type, test and sync commands;
6. record whether real Playtest input/visual observation and multi-client testing are available;
7. do not publish, redesign, rewrite architecture or create gameplay features during bootstrap;
8. set profile status to `ready` only when editing the wrong source is no longer a material risk.

Ask only when source authority, target selection or authorization cannot be established safely.

---

## 4. Source-authority lock

Before every edit, classify the target as one of:

```text
REPOSITORY_AUTHORITY
STUDIO_AUTHORITY
OTHER_DECLARED_AUTHORITY
UNKNOWN
```

`UNKNOWN` is `BLOCKED` when an edit could be overwritten or lose work.

Do not independently edit the same source in both the repository and Studio. Sync only through the project's declared workflow.

---

## 5. Work-order execution

Execute only entries marked `READY`.

### Single mode

Execute the first unblocked `READY` task, then report and stop.

### Batch mode

Execute ready tasks in declared order up to `max_tasks_per_run`. After each task:

1. validate its acceptance criteria using the exact `AT`, `LI`, `PV`, `MU` or static category;
2. update its factual status;
3. update only affected fields in `PROJECT_STATE.md`;
4. stop on the first configured failure, blocker, manual gate, unsafe Studio state or publishing gate.

Do not invent backlog tasks or broaden one gameplay change into a general system rewrite.

---

## 6. Architecture boundaries

- Keep authoritative game decisions on the server.
- Treat the client as untrusted for permissions, rewards, inventory, purchases and persistent state.
- Reuse the project's service/controller/module organization.
- Preserve remote names and contracts unless the task requires a coordinated change.
- Keep shared code free of server-only secrets and privileged state.
- Avoid per-frame work, unbounded connections and leaked Instances.
- Do not create fallback remotes, duplicate scripts or parallel systems to avoid understanding the existing architecture.

When the task touches a security-sensitive boundary, apply the Roblox security module even if the work order omitted it.

---

## 7. Targeted inspection

Use this order:

```text
1. Project profile and active task
2. Authoritative source and exact script/Instance path
3. Direct requires, callers, remotes and state dependencies
4. Relevant tests and sync configuration
5. Broader repository/DataModel inspection only when required by evidence
```

Do not scan the whole DataModel or start Play without a defined validation purpose.

---

## 8. Validation planning

Use the validation categories and forbidden-claim rules in `ROBLOX_STUDIO.md`.

Before implementation, map each acceptance criterion to its minimum evidence:

- deterministic module logic: static plus `AT` or `LI`;
- server state transition: `AT` or `LI` with authoritative state evidence;
- UI, prompt, input or animation: `PV`, otherwise `MU NOT_RUN`;
- persistence: supported integration path, otherwise `NOT_RUN`;
- replication or multiplayer: real multi-client/server test;
- exploit resistance: server rejection evidence for relevant invalid input.

Never silently downgrade `PV` to `LI` or multi-client testing to a single client.

---

## 9. Studio session discipline

- Confirm the exact Studio instance and place before interacting.
- Record initial mode and return to Edit mode if the agent started Play/Run.
- Remove task-created debug Instances, data and logging.
- Check relevant runtime errors after exercised flows.
- If Studio connectivity is unavailable but repository work is safe, complete only repository-scoped work and report Studio checks as `NOT_RUN` or `BLOCKED` as applicable.
- Do not publish because code appears correct.

---

## 10. External actions

`commit`, `push`, Studio sync that overwrites state, publishing, production DataStore operations, monetization changes and live configuration changes each require explicit authorization from the active task or project profile.

Permission for repository edits is not permission to publish the experience.

---

## 11. Definition of done

A Roblox task is complete only when:

- the correct experience and source authority were used;
- explicit requirements are implemented;
- each required acceptance criterion has a status and evidence;
- validation categories are reported truthfully;
- Studio is left in the required final state;
- no unrelated Instances, scripts, remotes or debug artifacts remain;
- work-order and project-state updates are factual, when enabled;
- publishing and Git actions match authorization;
- the JAP Agent Report and Roblox addendum are returned.

**End of harness.**
