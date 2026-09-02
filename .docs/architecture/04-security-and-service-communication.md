# 04 — Security and Service Communication

## Trust model

### Human

```text
Browser
 ↓
Supabase Auth
 ↓
Gateway/Application
 ↓
Identity
 ↓
Principal
 ↓
IAM
```

### Service

```text
Service A
 ↓
Service Principal
 ↓
short-lived token
 ↓
Service B
 ↓
IAM
```

## Rules

1. Every service is authenticated.
2. Every service is authorized.
3. Authentication does not imply permission.
4. Client-supplied principal/tenant/scope IDs are not trusted.
5. Services do not share databases.
6. Services do not use static shared credentials where avoidable.
7. Tokens are audience-bound.
8. Tokens are short-lived.
9. Secrets are rotated.
10. Sensitive operations are audited.

## Cloud identity vs Figentra identity

```text
Figentra Service Principal
        +
Cloud Workload Identity
```

Cloud identity authorizes infrastructure access.

Figentra principal authorizes application/service access.

## Workers package

The repository groups Cloudflare Worker deployables under `workers/`:

```text
workers/
├── gateway/      # edge routing, security, rate limits
├── registry/     # Application Registry API/read path
└── webhooks/     # centralized external webhook ingress/verification/dispatch
```

These are separate deployables only when operationally justified; the package layout does not require three independent deployments on day one.

## Gateway

Cloudflare Worker gateway may provide:

- routing
- WAF integration
- rate limiting
- request normalization
- auth-context validation
- request IDs
- edge policy

Gateway is not the complete IAM engine.

## HTTP

Synchronous calls use versioned HTTP APIs.

Requirements:

- timeout
- retries only when safe
- idempotency
- request/correlation IDs
- authentication
- authorization

## Events

Asynchronous state propagation uses durable events.

Use transactional outbox where state and event publication must be atomic.

## Transport

Candidates:

- Cloudflare Queues
- AWS SQS/SNS/EventBridge
- Kafka/MSK for actual streaming needs

Do not force one transport for all workloads.

## Event delivery

Consumers must be idempotent.

Support:

- retry
- dead-letter
- replay
- poison-message handling

## Correlation

Propagate:

```text
request_id
correlation_id
trace_id
principal_id
```

and trusted tenant/scope context where applicable.

## Token forwarding

Do not blindly forward user JWTs to every downstream service.

Use:

- token exchange
- service token
- explicit delegated context

where required.

## Secrets

Never store secrets in:

- Git
- frontend bundles
- container images
- ordinary logs

## mTLS

mTLS is a possible additional infrastructure trust layer.

It does not replace IAM authorization.

## Webhook Gateway

Webhook delivery is handled by Convoy behind a Figentra-owned webhook contract.

No application service directly owns retry/delivery infrastructure.

```text
Service
 ↓
Event
 ↓
Webhook contract
 ↓
Convoy
 ↓
External endpoint
```
