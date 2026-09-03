# 22 — Edge Workers and Webhook Gateway

**Status: APPROVED FOUNDATION**

## Runtime groups

```text
workers/
├── gateway/
└── registry/
```

Webhook delivery is intentionally **not** implemented as a custom Worker.

## API Gateway — Cloudflare Worker + Hono

Responsibilities:

- edge routing
- hostname/domain resolution
- rate limiting
- request IDs
- security headers
- CORS
- lightweight authentication-context validation
- routing to Registry or backend services
- public API exposure where appropriate

Non-responsibilities:

- business logic
- authoritative IAM
- application databases
- long-running workflows

## Application Registry — Cloudflare Worker + Hono

The Registry is a lightweight control-plane service.

Responsibilities:

- applications
- versions
- capabilities
- modules
- resources/actions metadata
- permissions metadata
- branding/theme configuration
- endpoint/routing metadata
- public application discovery

Suggested storage:

```text
D1 = authoritative registry data
KV/cache = optional read optimization
```

Registry does not own application business data.

## Webhook Gateway — Convoy

Figentra uses **Convoy** as the webhook infrastructure rather than implementing
a webhook platform inside a Worker.

Deployment location:

```text
infrastructure/
```

Convoy may run:

- Cloudflare-compatible container infrastructure where supported
- AWS ECS
- Kubernetes
- another Docker-compatible environment

The platform contract remains Figentra-owned so Convoy can be replaced.

## Inbound webhook flow

```text
External provider
       ↓
Convoy
       ↓
provider verification
       ↓
idempotency / replay protection
       ↓
normalized Figentra event
       ↓
event transport
       ↓
owning service
```

Examples:

- Stripe → Monetization
- Paddle → Monetization
- Supabase Auth → Identity
- external integrations → Integrations

## Outbound webhook flow

```text
Figentra service
       ↓
transactional outbox
       ↓
event transport
       ↓
Webhook Gateway / Convoy
       ↓
subscription/filter matching
       ↓
signing
       ↓
delivery
       ↓
retry / backoff / circuit breaking
       ↓
customer endpoint
```

## Why Convoy instead of a Worker?

A webhook system needs durable delivery state and operational features:

- endpoint management
- subscriptions
- event filtering
- delivery attempts
- retries
- backoff
- rate limits
- circuit breakers
- signatures
- replay
- delivery history
- dead-letter handling

Building these in Workers would recreate an existing distributed system.

Cloudflare Workers remain excellent for the API Gateway and Registry, where the
workload is edge-oriented and lightweight.

## Important boundary

Convoy is infrastructure.

Figentra owns:

- event semantics
- authorization
- tenant/scope semantics
- application ownership
- webhook contract/version
- which events may be exposed

Convoy owns delivery mechanics.

No Figentra service should depend directly on Convoy's database.

## Repository rule

Do not create:

```text
Convoy
a dedicated public API Worker
```

unless a new ADR demonstrates a concrete operational need.

`public API` is an exposure model, not a bounded service.

## Official scaffolding

Workers start from the official Cloudflare/Hono scaffold.

Convoy uses its official Docker/self-hosted deployment model.

Do not copy an ad-hoc Worker or Convoy deployment skeleton between environments.

## Queue boundary

Cloudflare Workers use Cloudflare Queues as the default messaging primitive.
Node/Nest applications may use the `@figentra/queue` BullMQ/Redis adapter when
they require Node-specific queue capabilities. The adapter is optional and does
not replace Cloudflare Queues in Worker runtimes.
