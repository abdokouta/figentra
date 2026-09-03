# 12 — Versioning

**Status:** Baseline **Owner:** Platform architecture (`@figentra/versioning`)
**Related:** [08 API Gateway](08-api-gateway.md),
[11 Events & workflows](11-events-and-workflows.md),
[06 Application Registry](06-application-registry.md)

---

## 1. Purpose

Versioning is a **platform-wide** concern, not just REST paths (R-10). A single
package — `@figentra/versioning` — defines the compatibility, deprecation, and
sunset model across every versioned surface.

---

## 2. Versioned surfaces

`@figentra/versioning` governs versioning for:

| Surface                   | Version carrier                          |
| ------------------------- | ---------------------------------------- |
| **REST APIs**             | URL path (`/api/v1/...`)                 |
| **Webhooks**              | Payload `version` + subscription version |
| **Events**                | Envelope `version` field ([11 §3])       |
| **Workflows**             | Workflow definition version              |
| **Integrations**          | Integration manifest version             |
| **SDK compatibility**     | Package semver + supported-API matrix    |
| **Application manifests** | `manifestVersion` ([06 §5])              |

---

## 3. REST API versioning

- Public platform APIs use **URL versioning**: `/api/v1/...`.
- A new major version is a **new file/route surface** (`/api/v2/...`), not an
  in-place mutation of `/v1`.
- Internal service contracts may evolve faster but remain **explicit and
  versioned**.
- The API Gateway routes each version to the correct service version ([08 §7]).

Breaking change rule: never break an existing contract without a new version + a
migration/deprecation path.

---

## 4. Event & webhook versioning

- Events carry `version` in the envelope. Adding an **optional** field is
  backward-compatible (no version bump required by consumers). Removing/renaming
  a field or changing a type is **breaking** → new event `version`.
- Producers may emit both old and new versions during a migration window.
- Webhooks version their payloads; subscriptions pin (or negotiate) a version so
  a tenant's receiver is not broken by a platform change.

---

## 5. Compatibility / deprecation / sunset model

A mature, explicit lifecycle for every versioned artifact:

```text
Active  →  Deprecated  →  Sunset  →  Removed
```

| Stage          | Meaning                                                  | Signal                                      |
| -------------- | -------------------------------------------------------- | ------------------------------------------- |
| **Active**     | Fully supported.                                         | —                                           |
| **Deprecated** | Still works; a newer version exists; migrate.            | `Deprecation` + `Sunset` headers; changelog |
| **Sunset**     | Scheduled end-of-life date announced; may warn/throttle. | `Sunset: <date>` header                     |
| **Removed**    | No longer available.                                     | `410 Gone` / version-not-found error        |

- Deprecation and sunset are **announced with lead time** and surfaced in
  response headers + the developer changelog
  ([docs](01-platform-architecture.md) §3).
- Consumers get a **compatibility matrix** (which SDK version supports which API
  version).

---

## 6. `@figentra/versioning` responsibilities

- Define the version metadata model (surface, version, stage, sunset date).
- Provide helpers to stamp/read version headers (REST) and envelope versions
  (events/webhooks).
- Provide the compatibility matrix + deprecation registry consumed by the
  gateway, the SDK, and the developer portal/docs.
- Emit deprecation warnings (logs/headers) when a deprecated surface is used.

It does **not** own routing (gateway) or business logic — it is a cross-cutting
policy + helper package.

---

## 7. SDK & manifest versioning

- **SDK:** semver. A published SDK version declares which platform API versions
  it supports (compatibility matrix). Breaking SDK changes = major bump +
  changeset ([19 CI/CD](19-environments-and-cicd.md) uses Changesets).
- **Application manifest** (`manifestVersion`) and **integration manifest**
  versions gate registry ingestion — the registry validates a manifest's version
  is supported before publishing its permissions/entitlements
  ([06](06-application-registry.md), [07](07-integration-platform.md)).

---

## 8. Non-goals / anti-patterns

| Anti-pattern                                                | Correct                                                  |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| Mutating `/v1` in place with a breaking change              | New version surface (`/v2`) + deprecation of `/v1`.      |
| Versioning only REST and ignoring events/webhooks/manifests | Platform-wide versioning via `@figentra/versioning`.     |
| Removing an event field without a version bump              | New event `version`; dual-emit during migration.         |
| Silent breaking changes                                     | Announced deprecation + sunset with lead time + headers. |
| Deprecation logic scattered per service                     | Centralized in `@figentra/versioning`.                   |

---

## 9. Open questions

- Confirm standard deprecation lead time (e.g. 90/180 days) and whether sunset
  enforcement throttles or hard-fails at the date.
- Confirm whether webhook subscriptions pin a version or auto-negotiate the
  latest compatible.
