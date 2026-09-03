---
inclusion: manual
---

# Service boundary

> **ADR anchors.**
>
> - [ADR-0022](../../.docs/adr/0022-language-agnostic-service-boundary.md) — the
>   four-seam contract (identity, JWT, wire shapes, observability).
> - [ADR-0087](../../.docs/adr/0087-openapi-first-contract-and-generated-typescript-sdks.md)
>   — per-service `api/openapi.yaml` + generated SDKs.
> - [ADR-0033](../../.docs/adr/0033-cross-service-authentication-contract.md) —
>   user JWT + `X-Service-Identity` header.
> - [ADR-0032](../../.docs/adr/0032-six-service-split.md) — the 6 SHARED
>   services (per ADR-0088: identity, commerce, notifications, observability,
>   platform, marketing).

Pull in via `#service-boundary` from any spec that adds a deployable (a new
service under `figentra-inc/backend/*` or `academorix/backend/*`), introduces a
new cross-service call, or proposes a new language for any service.

## The rule

The platform is polyglot on purpose — **TypeScript (Cloudflare Workers) for the
tenant business API, Python for AI/ML.** Keep it that way. Do not propose
consolidating the backend onto Python. Go is permitted as a third backend
language, but a new _language_ for a service is allowed only with **profiling
evidence** that the existing stack can't meet the requirement, and even then it
is added _alongside_ the TypeScript services as its own service — never as a
replacement.

Every deployable, in any language, integrates through exactly four seams:

1. **Identity** — a row in the identity service's `service_accounts` table + one
   service token (personal access token) with a minimal, explicit ability set
   (default-deny). Identity service is the single source of truth for authz.
   Never invent a parallel auth scheme.

2. **Inbound trust** — verify the short-lived HS256 service JWT on calls from
   other services: signature (constant-time), `exp`/`iat` (30s skew), `aud` ==
   own slug, non-empty `iss` / `tenant_id`. The shared
   `@figentra/service-client` package ships this verifier + issuer (a
   `FigentrisConnector` client).

3. **Data** — speak the shared wire shapes only. Two directions:
   - **Synchronous HTTP** — per-service `api/openapi.yaml` compiled to a
     generated SDK per ADR-0087. Consumers
     `pnpm add @figentra/<service>-service-sdk` and call the domain facade.
     Never hand-roll cross-service HTTP.
   - **Asynchronous events** — queue/topic schemas + shared DTOs. AsyncAPI
     adoption is deferred to a future ADR (0089+); events continue using the
     current JSON-schema shape per `.kiro/steering/events-authoring.md`.

4. **Observability** — propagate `X-Correlation-Id` (+ `traceparent` on async
   events) and emit the standard structured-log shape (`timestamp`, `level`,
   `service`, `tenant_id`, `trace_id`, `span_id`, `message`). Expose `/health` +
   `/ready`. `FigentrisConnector` propagates correlation automatically.

## Where the contract lives

Per ADR-0087 §D2 — every service owns its OpenAPI YAML at `api/openapi.yaml` in
its own repo:

```
figentra-inc/backend/identity/api/openapi.yaml
figentra-inc/backend/commerce/api/openapi.yaml
figentra-inc/backend/notifications/api/openapi.yaml
figentra-inc/backend/observability/api/openapi.yaml
figentra-inc/backend/platform/api/openapi.yaml
figentra-inc/backend/marketing/api/openapi.yaml          ← per ADR-0088
academorix/backend/api/api/openapi.yaml
academorix/backend/ai/api/openapi.yaml
```

The workspace-wide `.docs/contracts/` folder is **RETIRED**. Every per-endpoint
JSON schema + envelope schema + `service-jwt.v1.schema.json` +
`service-identity.v1.schema.json` migrates into shared OpenAPI components under
a small `@figentra/openapi-components` workspace package.

## When reviewing or writing a spec

- **Default to a package, not an app.** An app needs a distinct HTTP surface,
  runtime profile, release cadence, or deployment isolation. A new language
  needs profiling evidence on top of that.

- **The OpenAPI YAML is the source of truth.** Generate SDKs from it (per
  ADR-0087); never hand-copy shapes into consumer code.

- **Adding an optional field is safe.** Renaming / removing a field OR
  tightening a constraint is a **breaking change** requiring a coordinated
  major-version bump per ADR-0087 §D7. CI's `openapi-diff` gate enforces this
  automatically.

- **Signature scheme is fixed** — HS256 over a `>=32`-byte Doppler secret;
  refuse to boot on a weak/short secret. Per ADR-0033.

- **Every cross-service token is tenant-scoped.** No `tenant_id`, no trust.

## Adding a new service — checklist

1. **Scaffold the service** from `templates/microservice/` via
   `pnpm bootstrap:microservice`. Sets the package name per ADR-0069 scope
   rules.

2. **Add an OpenAPI generator** to the service's `package.json` dev deps (e.g.
   `@asteasolutions/zod-to-openapi`, or the service framework's built-in OpenAPI
   emitter).

3. **Configure the generator** to emit `api/openapi.yaml` at the service repo
   root.

4. **Author the OpenAPI shape** — define every route + every request/response
   DTO as a schema (e.g. Zod schemas registered with the OpenAPI registry).

5. **Run `npm run openapi:gen`** — commit the generated `api/openapi.yaml`.

6. **Configure the publish CI job** in `.gitlab-ci.yml` — compile the SDK on git
   tag push, publish to the GitLab group npm registry.

7. **Register the service** in `terraform/catalog.json` under the `services`
   array.

8. **Register in operator docs** — `.docs/services.md` service table.

9. **Wire consumers** — every peer service that calls this one adds
   `@figentra/<service>-service-sdk` to its `package.json`.

## Do not

- Do not build `apps/stream-gateway` (or any speculative hot-path service)
  without profiling evidence. The _contract_ exists so the _service_ can be
  added later as a bounded task, not so it can be added now.

- Do not proxy end-user tokens between services — each service uses its own
  identity + issues its own service-level JWT.

- Do not add a bespoke header or side channel between services; extend a
  documented OpenAPI shape instead.

- Do not hand-roll `fetch('/api/v1/…')` cross-service — use the generated SDK.

- Do not commit a service without `api/openapi.yaml` — CI blocks the merge.
