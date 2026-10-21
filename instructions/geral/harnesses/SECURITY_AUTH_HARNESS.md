# JAP Harness — Security and Authentication

**Version:** 1.0  
**Status:** Stable  
**Requires:** `instructions/JAP.md`, `instructions/EXECUTION_FAST.md`

---

## 1. Activation

Load this harness when work affects identity, authentication, sessions, authorization, roles, permissions, secrets, sensitive data or security controls.

This is a defensive development harness. It does not authorize testing third-party systems, bypassing access controls or destructive exploitation.

---

## 2. Bootstrap

When the profile is `bootstrap_required`:

1. identify the identity provider and authoritative user store;
2. map authentication, session and authorization boundaries;
3. record roles, permissions and protected resources only when verified;
4. identify approved secret storage and security-test commands;
5. classify sensitive data without copying its values;
6. record trusted environments and test accounts;
7. do not rotate secrets, alter production policies or create privileged users during bootstrap.

Leave unknown policy decisions as `UNSET`. Treat unclear privilege boundaries as a blocker for sensitive changes.

---

## 3. Work-order execution

Execute only entries marked `READY` under the configured `single` or bounded `batch` mode.

Stop on failure, blocker, unavailable test identity, risk of user lockout, secret-operation gate, policy-change gate or external-action gate. Never expand a localized change into an unrestricted security audit.

---

## 4. Security invariants

```text
SEC-I01 — Authenticate identity at the authoritative boundary.
SEC-I02 — Authorize every protected action and object access server-side.
SEC-I03 — Default to denial when permission cannot be established.
SEC-I04 — Never expose secrets, tokens, credentials or private keys.
SEC-I05 — Treat external and client-controlled input as untrusted.
SEC-I06 — Preserve auditability without logging sensitive payloads.
SEC-I07 — Test allowed and denied paths when authorization changes.
SEC-I08 — Never claim a system is secure from a limited check.
```

---

## 5. Authentication and session rules

- Use the project's established identity provider and session model.
- Do not build custom cryptography or password storage when an approved mechanism exists.
- Preserve secure cookie, expiry, revocation and rotation behavior.
- Prevent tokens and session identifiers from entering URLs, client logs or reports.
- Do not weaken multi-factor, verification or recovery controls to simplify development.
- Treat account recovery and identity linking as high-risk flows.

---

## 6. Authorization rules

- Check role or permission and resource ownership where applicable.
- Client-side visibility is not authorization.
- Test horizontal access, vertical privilege and unauthenticated denial for affected resources.
- Avoid role-name checks scattered through code when an established policy layer exists.
- Changes to administrator, finance, moderation, legal or production privileges require explicit scope and negative-path validation.

---

## 7. Secrets and sensitive data

- Store secrets only in approved secret or environment systems.
- Never include real secrets in fixtures, screenshots, reports or commits.
- Use minimum required data in tests.
- Preserve encryption, retention and redaction controls.
- Secret rotation, credential revocation and production policy changes are external actions requiring exact authorization.

---

## 8. Validation categories

| Code | Category | Minimum evidence |
|---|---|---|
| `AU` | Authentication | Identity establishment or rejection was exercised |
| `AZ` | Authorization | Allowed and denied access paths were exercised |
| `SS` | Session | Expiry, revocation, cookie or token behavior was exercised |
| `IV` | Input validation | Relevant invalid or hostile-shaped input was safely rejected |
| `SC` | Secret/config | Storage and exposure paths were inspected or tested without revealing values |
| `LG` | Logging/audit | Required event recorded with sensitive fields redacted |
| `DA` | Dependency analysis | Named scanner/check and relevant finding result |
| `MU` | Manual | Exact pending steps; not passed until user confirmation |

Every result must name the environment, identity/role class and tested boundary without exposing credentials.

Never claim:

- complete security from automated scanning;
- authorization from a hidden button;
- session security from successful login alone;
- safe secret handling because no secret appeared in one file;
- a vulnerability is exploitable without verified evidence.

---

## 9. Permitted testing boundary

Run only tests against local systems, owned environments or explicitly authorized targets. Use non-destructive proof and the smallest test required. Stop before actions that could expose third-party data, degrade service or establish persistence.

---

## 10. Definition of done

A security/auth task is complete only when:

- the identity and policy authorities were identified;
- required allowed and denied paths were evaluated;
- secrets and sensitive data remained protected;
- findings distinguish verified defects, risks and untested hypotheses;
- no production policy, credential or user state changed without authorization;
- required validation has factual evidence;
- the JAP Agent Report is returned.

**End of harness.**
