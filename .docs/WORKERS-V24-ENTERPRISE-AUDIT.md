# Figentra Workers V24 — Enterprise Day-1 Audit

## Scope

This audit reviews all current Workers against:

1. Production correctness and full business/control-plane logic.
2. Repository and Worker standardization.
3. Security, reliability, observability, testing, deployment and operational gaps.
4. The current Figentra architecture: Gateway, Application Registry, and Infrastructure Orchestrator.

The review is based on the V23 repository artifact. It is intentionally a **review
and task baseline**, not a claim that external Cloudflare/Supabase/NATS resources
are already provisioned.

---

# Executive verdict

**STATUS: NOT READY FOR Enterprise Day-1 production.**

The architecture is directionally correct, but the current Worker layer has
several **P0 correctness blockers**. The most important are:

- Vitest is configured to discover `__tests__/unit` and `__tests__/integration`,
  while the actual tests are under `src/*.test.ts`; therefore the configured
  test command can pass without running the real tests.
- Gateway/Registry tests import `createGateway`/`createRegistry` from `index.ts`,
  but the Worker entrypoints do not export those factories.
- Registry references cache constants without importing them.
- Infrastructure Orchestrator has an environment-name contract mismatch:
  API schema uses `development/staging/production`, while the Workflow input and
  runner use `dev/stg/prd`.
- Wrangler environment configuration does not consistently repeat bindings and
  vars for each environment. Cloudflare documents that environment bindings/vars
  are not inherited, so `--env production` can produce Workers missing required
  runtime configuration.
- The Terraform Wrangler renderer handles only Gateway and Registry, not the
  Infrastructure Orchestrator.
- Several repository gates are stale after the architecture refactor and still
  reference removed Terraform deployables or old migration filenames.
- Gateway's service OAuth credentials are required by code but are not declared
  in Wrangler configuration as a secret/runtime contract.
- Registry's registration rate-limit binding is declared in TypeScript but is not
  configured in Wrangler.
- There are currently no actual Worker unit/integration suites in `__tests__`;
  only the setup files exist.

The good news: the core boundaries are sound and can be made production-grade
without redesigning the architecture.

---

# 1. Worker-by-worker verdict

| Worker | Architecture | Logic | Security | Tests | Deployment | Day-1 |
|---|---|---|---|---|---|---|
| Gateway | GOOD | BLOCKED | NEEDS HARDENING | BLOCKED | BLOCKED | RED |
| Registry | GOOD | BLOCKED | NEEDS HARDENING | BLOCKED | BLOCKED | RED |
| Infrastructure Orchestrator | GOOD | BLOCKED | HIGH-RISK | BLOCKED | BLOCKED | RED |

---

# 2. P0 — Must fix before any production deployment

## P0.1 Test discovery is currently broken

Vitest configuration includes:

```text
__tests__/unit/**/*.test.ts
__tests__/integration/**/*.test.ts
```

but the actual tests are:

```text
services/gateway/src/index.test.ts
workers/registry/src/index.test.ts
```

and Infrastructure Orchestrator has no test file.

Because `passWithNoTests` is enabled, the repository can report success without
executing the intended Worker test suite.

### Required decision

Standardize:

```text
__tests__/
├── unit/
├── integration/
├── e2e/
├── fixtures/
└── vitest.setup.ts
```

Move Worker tests into the appropriate directories.

Production gates must fail when a Worker has zero tests unless it is explicitly
marked as an intentionally testless artifact.

---

## P0.2 Test entrypoint exports are inconsistent

Gateway/Registry tests import their composition factory from `src/index.ts`,
while `index.ts` only exports the default Worker.

Standardize:

```ts
export { createGateway } from "./app.js";
export default createGateway();
```

and:

```ts
export { createRegistry } from "./app.js";
export default createRegistry();
```

The same pattern should be used for the Orchestrator factory.

---

## P0.3 Registry has unresolved symbol references

The Registry route modules reference:

```text
REGISTRY_CACHE_TTL_SECONDS
ROUTE_CACHE_TTL_SECONDS
```

without importing the constants.

These are direct compilation blockers.

---

## P0.4 Orchestrator environment contract is inconsistent

The public API schema accepts:

```text
development
staging
production
```

but:

```text
TerraformWorkflowInput
```

accepts:

```text
dev
stg
prd
```

and `runner/entrypoint.sh` validates:

```text
dev
stg
prd
```

This is not acceptable for a production control plane.

### Standard

Use:

```text
development
staging
production
```

everywhere in the application domain.

Only infrastructure adapters may translate to short provider-specific names,
and that translation must happen at one explicit boundary.

---

## P0.5 Wrangler environment inheritance is unsafe

The repository defines top-level bindings/vars and then environment-specific
configuration containing only a subset of them.

Cloudflare's current Workers guidance explicitly states that bindings and vars
must be declared per environment; they are not inherited. Therefore an
`--env production` deployment must contain the complete production binding
contract.

This affects especially:

- Gateway identity variables.
- Gateway KV/rate-limit binding.
- Registry Identity variables.
- Orchestrator D1/container/workflow bindings.

The Wrangler configuration needs a generated environment-complete representation.

---

## P0.6 Wrangler rendering is incomplete

`render-wrangler-bindings.mjs` currently supports:

```text
gateway
registry
```

but not:

```text
infrastructure-orchestrator
```

The Orchestrator has the most sensitive infrastructure bindings, so it cannot
remain outside the renderer.

The renderer must generate/validate:

```text
development
staging
production
```

for all Workers.

It must also fail closed if any required placeholder remains.

---

## P0.7 Gateway service identity credentials are incomplete

Gateway code requires:

```text
SERVICE_CLIENT_ID
SERVICE_CLIENT_SECRET
```

but the Wrangler configuration does not define them as runtime secrets.

The architecture should explicitly define:

```text
Service Identity
    ↓
credential source
    ↓
token exchange
    ↓
audience-bound service token
```

The secret must come from Cloudflare Secrets/Secrets Store or the approved
secret manager, never a Wrangler `vars` value.

---

## P0.8 Orchestrator production bindings/secrets are incomplete

The Orchestrator requires:

```text
DB
TERRAFORM_RUNNER
INFRA_WORKFLOW
TERRAFORM_REPOSITORY
TERRAFORM_GIT_TOKEN
IDENTITY_JWKS_URL
IDENTITY_ISSUER
IDENTITY_AUDIENCE
```

but its environment configurations do not fully declare the required runtime
contract.

The production configuration must be complete and independently deployable.

---

# 3. Gateway audit

## What is correct

The Gateway has the correct high-level responsibilities:

```text
request
  ↓
request/correlation context
  ↓
Identity JWT verification
  ↓
rate limit
  ↓
Registry route resolution
  ↓
IAM authorization
  ↓
audience-specific token exchange
  ↓
upstream
```

This is the right boundary.

Cloudflare Service Bindings are also the correct mechanism for private
Worker-to-Worker communication rather than exposing Registry publicly. Cloudflare
documents Service Bindings as private, low-latency Worker-to-Worker communication.

## Gaps

### P1 — Upstream timeout only covers the final upstream

Identity/token-exchange/IAM calls do not have explicit timeouts.

Every network call must have:

- timeout,
- bounded retry policy where safe,
- circuit breaker where appropriate,
- correlation propagation,
- failure classification.

### P1 — Circuit breaker is isolate-local

The current circuit state is:

```ts
const circuits = new Map(...)
```

This is acceptable as a small local optimization but is not a distributed
circuit breaker. It must never be treated as authoritative.

For enterprise behavior:

- local circuit breaker = optimization;
- Cloudflare rate limiting/WAF = perimeter protection;
- upstream health/SLO = authoritative operational signal.

### P1 — Route cache is not tenant/domain aware

Current cache key:

```text
route:v1:{method}:{pathname}
```

For the final multi-tenant/custom-domain architecture, route identity should
consider the appropriate routing context, potentially:

```text
environment
host/domain
tenant
application
method
path
API version
```

Otherwise a route registered for one domain/tenant can be reused for another
context if the registry semantics become tenant-aware.

### P1 — Route authorization semantics need an explicit default

A route with no `requiredPermission` currently passes IAM authorization.

That can be valid, but the registry must distinguish:

```text
public
authenticated
permission_required
service_only
```

Do not encode security semantics through "permission missing".

### P1 — Request body streaming needs explicit policy

The Gateway proxies the request body directly, which is good.

Add limits and explicit policies for:

- maximum body size,
- upload routes,
- content type,
- hop-by-hop headers,
- forwarding headers,
- response size/streaming,
- request decompression behavior.

### P1 — Header trust boundary

The Gateway currently sets:

```text
x-figentra-principal-id
x-figentra-tenant-id
```

The upstream contract must explicitly say these headers are trusted **only**
when originating from the Gateway.

Direct public access to upstream services must be impossible or must reject
these headers.

---

# 4. Registry audit

## What is correct

The Registry correctly separates:

```text
D1 = authoritative
KV = cache
```

and registration is intended to atomically write:

- application,
- version,
- routes,
- capabilities,
- modules,
- resources,
- actions,
- environments,
- audit record.

That is the right model.

## Gaps

### P0 — Registration idempotency/concurrency

The sequence:

```text
SELECT existing registration
INSERT registration
```

is race-prone under concurrent requests.

The unique constraint protects integrity, but the API should have an explicit
idempotency contract.

Add:

```text
Idempotency-Key
```

and/or use the registration key/content hash as an idempotency identity.

Return the existing registration when the exact same content is submitted.

Reject a conflicting payload deterministically.

### P1 — Route collision validation

Registration validates upstream URLs but does not appear to reject conflicting
routes.

Two applications could register overlapping patterns:

```text
GET /v1/orders/:id
GET /v1/orders/*
```

The current resolver uses:

```text
ORDER BY length(path_pattern) DESC
```

which is not a sufficient formal routing precedence system.

Define:

- route priority,
- specificity,
- host/domain,
- version,
- tenant scope,
- conflict detection.

### P1 — Registry route resolver scalability

It currently loads up to 500 routes and evaluates `URLPattern` in application
code.

That is acceptable for an early control plane but not the final scale model.

The next version should precompute/normalize route resolution metadata and cache
it aggressively.

### P1 — Metadata access policy

Application metadata/version/metadata endpoints are protected by general
authentication but do not have explicit read permissions.

Define:

```text
registry:application:read
registry:application:register
registry:route:resolve
registry:application:publish
registry:application:retire
```

etc.

### P1 — Public vs private registry APIs

Decide explicitly whether:

```text
GET /v1/applications/:slug
GET /v1/applications/:slug/metadata
```

are:

- public,
- authenticated,
- service-only.

This must not remain implicit.

### P1 — Manifest schema needs stronger semantic validation

Zod validates shape, but registration should additionally validate:

- unique modules,
- unique resources,
- unique actions,
- unique routes,
- valid module/resource relationships,
- valid permission identifiers,
- valid environments,
- valid deployment URLs,
- supported API versions,
- maximum serialized manifest size.

### P1 — Version immutability

The architecture says versions are immutable, but the service updates
`applications.current_version` and metadata during registration.

Add explicit lifecycle states:

```text
draft
registered
published
retired
revoked
```

and prohibit mutation of immutable version records.

---

# 5. Infrastructure Orchestrator audit

This is the highest-risk Worker.

## Correct architecture

The current boundary is good:

```text
HTTP Worker
    ↓
authentication
    ↓
IAM permission
    ↓
approval gate
    ↓
D1 intent record
    ↓
Workflow
    ↓
Cloudflare Container
    ↓
Terraform
```

Terraform is correctly kept outside the Worker runtime.

Cloudflare's current Container networking model supports an explicit
`allowedHosts` deny-by-default allowlist, which is appropriate for the runner.
The documentation also recommends controlling outbound traffic at the
container boundary.

## P0 — Environment mismatch

Already covered above.

## P0 — Approval is not an independent authorization decision

The current implementation checks:

```text
permission
+
approvalRef present
```

That is **not equivalent to approval validation**.

The production architecture needs:

```text
IAM
 ↓
policy decision
 ↓
approval service/change record
 ↓
verify approval state
 ↓
bind approval to:
   actor
   tenant/platform
   environment
   operation
   revision
   workspace
   requested resources
 ↓
execute
```

An arbitrary string such as:

```text
approvalRef = "ABC-123"
```

must not authorize production apply.

## P0 — Terraform source integrity

The runner fetches a Git revision and checks out the revision.

Good.

But Day-1 needs:

- verified commit signature or trusted source provenance,
- repository allowlist,
- exact repository/ref binding,
- Terraform module provenance,
- lockfile/provider checksum verification,
- immutable provider versions,
- artifact/image digest pinning.

## P0 — Terraform state locking

Production Terraform state must use a real remote backend with locking.

This must be verified as an actual production property, not merely documented.

## P1 — Plan/apply separation

For production:

```text
plan
 ↓
review
 ↓
approval
 ↓
apply EXACT plan artifact
```

The current `apply` performs another `terraform plan` immediately before
`terraform apply`.

That breaks the ideal reviewed-plan model.

A production approval should bind to a specific:

```text
plan hash
revision
workspace
environment
Terraform/provider lock state
```

and apply that exact artifact.

## P1 — Destroy needs a much stronger policy

Destroy should require:

- separate permission,
- explicit approval,
- reason,
- environment,
- resource scope,
- cooldown/confirmation,
- possibly two-person approval for production.

## P1 — Concurrency locking

Two jobs must not simultaneously mutate:

```text
same environment
same Terraform state
```

Add a distributed execution lock.

D1 status alone is not enough.

Use a durable coordination primitive appropriate to the Terraform state boundary.

## P1 — Job state machine

Current states are too small:

```text
queued
running
succeeded
failed
```

Enterprise control plane should model:

```text
requested
validating
awaiting_approval
approved
queued
running
planning
planned
applying
succeeded
failed
cancel_requested
cancelled
expired
rejected
```

with valid state transitions.

## P1 — Cancellation

There is no robust cancellation model.

Need:

```text
POST /v1/jobs/:id/cancel
```

with authorization and runner termination semantics.

## P1 — Retry semantics

Workflow retries must distinguish:

```text
safe retry
unsafe retry
Terraform partial apply
provider failure
authentication failure
state lock failure
human approval failure
```

Never blindly retry `apply`.

## P1 — Secrets

Do not pass long-lived Git/provider credentials unnecessarily through Worker
request context.

Prefer a runtime secret mechanism available to the Container.

The container should receive the minimum secret set required for the selected
operation.

---

# 6. Cross-worker service-to-service security

The intended model should be standardized as:

```text
Caller
  │
  │ user/service token
  ▼
Gateway
  │
  │ token exchange
  ▼
audience-specific short-lived token
  │
  ├── Registry
  ├── IAM
  └── downstream service
```

Rules:

- Never forward the original user credential directly to arbitrary upstreams.
- Every downstream token has one audience.
- Every service verifies issuer + audience + signature.
- Authorization is deny-by-default.
- Service identity is separate from end-user identity.
- Delegation/impersonation is explicit.
- Tenant/scope context is signed or derived from trusted claims, never trusted
  from arbitrary HTTP headers.
- Correlation ID is propagated.
- Request ID is regenerated at every boundary if required by the boundary contract,
  while the parent correlation/trace remains linked.

Cloudflare Service Bindings should remain the preferred Worker-to-Worker path
where both services are Workers. They avoid a public network route and are
designed for service-oriented architectures. citeturn0search10turn0search5

---

# 7. Standardization audit

## Current good decisions

- Hono.
- Module Worker model.
- Wrangler.
- `wrangler types`.
- Oxlint instead of ESLint.
- Prettier.
- Stackra TypeScript config.
- Vitest.
- `cloud.yaml`.
- route-per-file naming.
- interface/type/constant separation.
- TSDoc/file documentation.
- D1 raw SQL + Wrangler migrations.
- one logical table per migration.
- generated infrastructure catalog.

## Standardization gaps

### P0 — Test directory standard is not actually followed

Fix immediately.

### P0 — Generated `worker-configuration.d.ts`

It must always be generated by:

```bash
wrangler types
```

and never manually edited.

Cloudflare explicitly recommends generating binding types from Wrangler
configuration. citeturn0search9

### P1 — One environment vocabulary

Repository standard:

```text
development
staging
production
```

Short aliases are CLI-only conveniences:

```text
dev → development
stg → staging
prd → production
```

Never use the aliases in domain models.

### P1 — Standard Worker package scripts

Every Worker should expose:

```text
dev
build
deploy
deploy:development
deploy:staging
deploy:production
cf-typegen
lint
lint:fix
format
format:check
typecheck
test
test:watch
test:coverage
check
```

### P1 — Standard test tree

```text
__tests__/
├── unit/
├── integration/
├── e2e/
├── fixtures/
└── vitest.setup.ts
```

### P1 — Documentation standard

Use TSDoc for:

- exported classes,
- exported interfaces,
- exported types,
- exported functions,
- exported constants,
- public route factories,
- public service methods,
- security-sensitive methods,
- non-obvious private methods.

Do **not** require meaningless comments on trivial one-line private code just
to satisfy a checkbox. The standard should enforce useful documentation, not
comment noise.

---

# 8. Repository gates that are now stale

The refactor left several automation files behind.

Examples include:

- Make target still named `infra-generate` for removed per-deployable Terraform.
- Production check expects old Registry migration filenames.
- Worker structure checks assume `src/index.test.ts`.
- Verification scripts only enumerate Gateway/Registry in places where the
  architecture now contains the Orchestrator.
- Wrangler renderer only handles Gateway/Registry.
- Some `.doppler.yaml` comments still mention Clerk even though Supabase is now
  the Day-1 identity provider.

These scripts are themselves production infrastructure and must be treated as
code, not documentation.

---

# 9. Observability gaps

Workers have observability enabled, which is good.

Cloudflare Workers Logs are available for all newly created Workers, and
OpenTelemetry/Logpush/Tail Workers can be used for export. citeturn0search1turn0search2

But Day-1 requires more than `observability.enabled`.

Every Worker needs:

### Structured logs

```text
timestamp
service
environment
request_id
correlation_id
trace_id
route
status
duration_ms
principal_id
tenant_id
error_code
```

Never log:

- access tokens,
- service tokens,
- cookies,
- authorization headers,
- secrets,
- Terraform credentials,
- full request bodies.

### Metrics

At minimum:

```text
request count
error rate
p50/p95/p99 latency
401/403 rate
429 rate
5xx rate
upstream failures
IAM latency
Identity latency
Registry latency
cache hit/miss
D1 latency
Workflow failures
Terraform duration
Terraform failure rate
```

### SLOs

Define actual targets before production:

```text
Gateway availability
Registry availability
Authorization latency
route resolution latency
Terraform orchestration availability
```

---

# 10. Reliability gaps

Add:

- upstream retry classification,
- idempotency keys,
- timeout budgets,
- circuit breakers,
- distributed locks,
- backpressure,
- rate limits,
- queue/workflow semantics,
- dead-letter strategy where asynchronous events exist,
- graceful degradation,
- cache invalidation guarantees,
- backup/restore tests,
- disaster recovery tests.

Cloudflare's current Worker guidance explicitly recommends Queues/Workflows for
background and retriable work rather than keeping long-running work in the
request path. citeturn0search9

---

# 11. Security test matrix

Before Day-1 production:

## Gateway

- [ ] malformed JWT
- [ ] expired JWT
- [ ] wrong issuer
- [ ] wrong audience
- [ ] invalid signature
- [ ] missing tenant
- [ ] forged tenant header
- [ ] route cache poisoning
- [ ] upstream SSRF
- [ ] header injection
- [ ] request smuggling
- [ ] oversized body
- [ ] rate-limit bypass
- [ ] service-token leakage

## Registry

- [ ] unauthorized registration
- [ ] wrong audience
- [ ] wrong permission
- [ ] duplicate registration
- [ ] concurrent registration
- [ ] route collision
- [ ] malicious URLPattern
- [ ] SSRF
- [ ] manifest size abuse
- [ ] cache poisoning
- [ ] stale cache after mutation
- [ ] version tampering

## Orchestrator

- [ ] unauthorized plan
- [ ] unauthorized apply
- [ ] unauthorized destroy
- [ ] fake approval reference
- [ ] approval replay
- [ ] revision substitution
- [ ] workspace escape
- [ ] repository escape
- [ ] Git credential leakage
- [ ] provider credential leakage
- [ ] Terraform state lock conflict
- [ ] concurrent apply
- [ ] workflow retry after partial apply
- [ ] container escape attempt
- [ ] outbound network bypass
- [ ] cancellation
- [ ] timeout

---

# 12. Performance/load tests

Required:

```text
Gateway:
  100 / 500 / 1k / 5k RPS profiles

Registry:
  read-heavy metadata
  route resolution
  registration bursts

Orchestrator:
  concurrent plan requests
  serialized apply requests
  workflow retries
```

Measure:

- p50
- p95
- p99
- error rate
- CPU
- D1 latency
- KV latency
- upstream latency
- Workflow execution time.

---

# 13. Final Worker target structure

```text
workers/<worker>/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── fixtures/
│   └── vitest.setup.ts
│
├── database/
│   ├── migrations/
│   ├── rollbacks/
│   └── README.md
│
├── src/
│   ├── constants/
│   ├── enums/
│   ├── interfaces/
│   ├── middleware/
│   ├── routes/
│   │   └── *.route.ts
│   ├── schemas/
│   ├── security/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── app.ts
│   └── index.ts
│
├── cloud.yaml
├── wrangler.jsonc
├── worker-configuration.d.ts
├── tsconfig.json
├── vitest.config.ts
├── .oxlintrc.json
├── .prettierrc
├── package.json
└── README.md
```

Orchestrator additionally owns:

```text
runner/
workflows/
```

with the runner isolated from the Worker application.

---

# 14. V24 implementation order

## Batch A — Correctness blockers

- [ ] Fix all TypeScript compile errors.
- [ ] Export Worker composition factories.
- [ ] Import missing Registry constants.
- [ ] Standardize environment domain values.
- [ ] Fix Orchestrator workflow input.
- [ ] Fix runner environment validation.
- [ ] Fix Wrangler environment completeness.
- [ ] Add Orchestrator Wrangler rendering.
- [ ] Add all required secrets/runtime contracts.
- [ ] Fix stale production/structure scripts.

## Batch B — Test foundation

- [ ] Move tests into `__tests__/unit`.
- [ ] Add integration suites.
- [ ] Add E2E suites.
- [ ] Add Cloudflare binding mocks.
- [ ] Add D1 integration harness.
- [ ] Remove unconditional `passWithNoTests` from production CI.
- [ ] Require coverage thresholds.

## Batch C — Gateway

- [ ] timeout policies
- [ ] retry policies
- [ ] circuit breaker
- [ ] route cache key design
- [ ] route security classification
- [ ] header trust contract
- [ ] body/stream limits
- [ ] service credential contract
- [ ] gateway integration tests
- [ ] load tests

## Batch D — Registry

- [ ] idempotency
- [ ] route conflict detection
- [ ] route priority
- [ ] domain/tenant context
- [ ] lifecycle states
- [ ] permission model
- [ ] manifest semantic validation
- [ ] cache consistency
- [ ] registration concurrency tests
- [ ] route resolution load tests

## Batch E — Infrastructure Orchestrator

- [ ] real approval verification
- [ ] plan artifact identity
- [ ] exact-plan apply
- [ ] distributed Terraform lock
- [ ] state backend validation
- [ ] job state machine
- [ ] cancellation
- [ ] retry classification
- [ ] destroy protection
- [ ] source provenance
- [ ] container secret injection
- [ ] container network hardening
- [ ] security tests

## Batch F — Cross-worker platform

- [ ] service identity contract
- [ ] token exchange contract
- [ ] audience registry
- [ ] permission registry
- [ ] request/correlation/trace standard
- [ ] error envelope
- [ ] rate-limit standard
- [ ] event contracts
- [ ] NATS integration
- [ ] outbox/relay
- [ ] DLQ/retry policy

## Batch G — Production gate

- [ ] Terraform plan
- [ ] dev deployment
- [ ] staging deployment
- [ ] staging smoke tests
- [ ] staging load tests
- [ ] security/DAST
- [ ] penetration testing
- [ ] rollback drill
- [ ] disaster recovery
- [ ] production approval
- [ ] production deployment
- [ ] production SLO verification

---

# 15. Enterprise Day-1 definition of done

The Workers are **not** Day-1 ready until all of these are true:

```text
[x] architecture boundaries defined
[x] Hono/Workers runtime selected
[x] deployment manifest model
[x] Terraform catalog model
[x] Worker route organization
[x] D1 migration model

[ ] source compiles cleanly
[ ] all intended tests actually execute
[ ] all Workers have unit/integration/E2E coverage
[ ] all Wrangler environments are complete
[ ] all runtime secrets are wired
[ ] IAM authorization is real
[ ] approval authorization is real
[ ] service identity is real
[ ] Terraform execution is concurrency-safe
[ ] Terraform state locking is verified
[ ] observability/SLOs are operational
[ ] security tests pass
[ ] load tests pass
[ ] staging deployment passes
[ ] rollback passes
[ ] production deployment passes
```

**Conclusion:** do not proceed directly to production infrastructure execution
yet. The next engineering batch should be **Batch A — Worker Correctness and
Deployment Contract**, because it fixes several concrete blockers that would
otherwise make the remaining security/load work misleading.
