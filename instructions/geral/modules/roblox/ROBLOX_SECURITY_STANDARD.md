# RSS — Roblox Security Standard

**Version:** 1.1  
**Status:** Security baseline  
**Requires:** `ROBLOX_STUDIO.md`

---

## 1. Activation

Load this module when a Roblox task affects:

- RemoteEvents or RemoteFunctions;
- permissions or administrative actions;
- currency, inventory, rewards or transactions;
- DataStore, MemoryStore or external HTTP state;
- network-owned physics or spatial authority;
- user-generated text;
- developer products or receipts.

Official Roblox documentation supersedes this baseline when platform behavior changes.

---

## 2. Core Model

```text
UNTRUSTED CLIENT INTENT
→ VALIDATE TYPE, SHAPE, RATE, PERMISSION AND STATE
→ AUTHORITATIVE SERVER DECISION
→ IDEMPOTENT/ATOMIC MUTATION
→ REPLICATED RESULT
```

The client is not a source of truth for permissions, currency, inventory, damage, rewards, prices, elapsed time or persistent state.

---

## 3. Invariants

| ID | Requirement |
|---|---|
| `SEC-NET-R01` | Validate type, range, shape, ownership, permission and current state for every incoming remote request. |
| `SEC-NET-R02` | Do not use synchronous `InvokeClient()` for authoritative server logic. |
| `SEC-NET-R03` | Apply server-side abuse controls appropriate to each remotely triggered action. |
| `SEC-DAT-R01` | Use atomic transformation for concurrent mutable persistent state. |
| `SEC-DAT-R02` | Handle service failures explicitly and use bounded retries only for retriable failures. |
| `SEC-DAT-R03` | Make shutdown saving bounded, observable and awaited within the available deadline. |
| `SEC-MKT-R01` | Grant each developer-product receipt at most once through atomic persistence. |
| `SEC-PHY-R01` | Keep critical world outcomes server-validated regardless of network ownership. |
| `SEC-MOD-R01` | Filter user-generated text before showing it to other users. |
| `SEC-ENV-R01` | Keep secrets and authoritative logic out of replicated containers and client code. |

---

## 4. Remote Security

Treat every remote as a public endpoint.

For each request, validate as applicable:

- argument count and types;
- finite numbers, allowed range and integer requirements;
- string length and allowed identifiers;
- table depth, size and permitted keys;
- player ownership and permissions;
- distance, line of sight and current server state;
- cooldown, token bucket, concurrency or request quota;
- whether the requested transition is valid now.

The client SHOULD send intent, not the final outcome.

Example:

```lua
remote.OnServerEvent:Connect(function(player, itemId, amount)
    if typeof(itemId) ~= "string" or typeof(amount) ~= "number" then
        return
    end
    if amount ~= amount or amount == math.huge or amount == -math.huge then
        return
    end
    if amount <= 0 or amount ~= math.floor(amount) or amount > 100 then
        return
    end
    if not InventoryService:CanModify(player, itemId, amount) then
        return
    end

    InventoryService:ApplyAuthoritativeChange(player, itemId, amount)
end)
```

### Server-to-client requests

Do not make authoritative server progress depend on `RemoteFunction:InvokeClient()`. A client may disconnect, error or never return.

Use an event-based request/response with a server-owned request ID and timeout when a client response is truly required. Never trust the response without validation.

---

## 5. Gameplay and Spatial Authority

The server computes or verifies:

- damage and critical hits;
- reward amount and eligibility;
- item ownership and consumption;
- interaction distance;
- cooldown completion;
- line of sight when relevant;
- legal state transitions.

For movement anomalies, avoid unconditional punishment from one sample. Account for latency, vehicles, teleports, impulses and legitimate abilities. Prefer denying the sensitive action or reconciling state with evidence before punitive action.

---

## 6. Physics and Network Ownership

Network ownership is a performance feature, not a trust grant.

- Anchor objects that do not require dynamic physics.
- Consider server ownership for critical non-character objects when performance permits.
- Validate sensitive collision, projectile and interaction outcomes on the server.
- Do not assume `SetNetworkOwner(nil)` alone prevents every physics exploit.
- Avoid global per-frame velocity clamps unless profiling and game design justify them.

---

## 7. Persistent Data

Use `UpdateAsync` or an equivalent atomic profile/session system when multiple servers or retries can affect the same mutable record.

Persistence code MUST:

- use `pcall` around service calls;
- distinguish retriable and permanent failures;
- bound retry count and delay;
- respect service budgets;
- avoid duplicate mutation on retry;
- surface failure without silently granting or discarding value;
- prevent simultaneous conflicting sessions when the data model requires it.

Do not use `SetAsync` for concurrent currency or inventory mutations unless the architecture proves there is no lost-update risk.

### Shutdown

`BindToClose` work must wait for tracked save operations only within the platform deadline. Spawning saves and waiting an arbitrary fixed duration is not proof that they completed.

---

## 8. Developer Products

`MarketplaceService.ProcessReceipt` must be idempotent.

For each `PurchaseId`:

1. Atomically inspect whether the receipt was already granted.
2. If not, atomically record the receipt and apply the grant in the same authoritative persistence transaction or an equivalent idempotent workflow.
3. Return `PurchaseGranted` only after the durable grant is confirmed.
4. Return `NotProcessedYet` when the grant cannot be confirmed so Roblox may retry.

Do not grant from purchase-prompt completion events.

---

## 9. Text and Content

- Filter user-generated text on the server before displaying it to other users.
- Do not replace Roblox filtering with a custom blacklist.
- Validate asset identifiers and handle loading failure.
- Asset ID format validation does not prove that content is safe or permitted.
- Keep dynamic code loading disabled unless a reviewed, unavoidable use case exists.
- Enable external HTTP only when required and restrict the external service boundary.

---

## 10. Replication and Secrets

- Keep authoritative logic and privileged tools in server-only containers.
- Do not put secrets, private keys or privileged modules in `ReplicatedStorage`, client scripts, attributes or replicated values.
- `StreamingEnabled` can reduce distant replicated geometry, but it is not an anti-wallhack guarantee.
- Never rely on client-side hiding as access control.

---

## 11. Supply Chain

Before accepting third-party models, plugins or modules:

- inspect all included scripts;
- investigate external numeric `require()` calls;
- investigate dynamic execution and obfuscation;
- review plugin permissions;
- pin or record trusted dependencies when possible;
- remove unused injected objects and scripts.

Do not run a workspace-wide audit for every small task. Perform it when adding an untrusted asset/plugin or when the task explicitly requests a security audit.

---

## 12. Security Validation

Relevant tests SHOULD include:

- wrong types and missing arguments;
- extreme, negative, infinite and `NaN` numbers;
- oversized or malformed tables and strings;
- repeated and concurrent requests;
- unauthorized ownership or role;
- invalid distance or state;
- duplicate receipt delivery;
- persistence failure and retry;
- client disconnect during a request.

Report which cases actually ran. A code review is not a penetration test.

---

## 13. Official References

- [Roblox client-server boundary](https://create.roblox.com/docs/scripting/security/client-server-boundary)
- [Roblox security tactics](https://create.roblox.com/docs/scripting/security/security-tactics)
- [Roblox data stores](https://create.roblox.com/docs/cloud-services/data-stores)
- [Roblox network ownership](https://create.roblox.com/docs/physics/network-ownership)
- [Roblox developer products](https://create.roblox.com/docs/production/monetization/developer-products)

**End of standard.**
