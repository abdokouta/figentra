---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/webhook'
---
# `@stackra/webhook` — Signed Webhook Capability

## Boundary
Reusable inbound/outbound webhook contracts. Integrations owns external connection/subscription business state; Notifications owns notification delivery. This package handles verification, signing, canonical envelopes, retries and HTTP transport helpers.

## Subpaths
```text
@stackra/webhook
@stackra/webhook/hmac
@stackra/webhook/http
@stackra/webhook/nestjs
@stackra/webhook/testing
```

## Public API
```ts
interface WebhookVerifier { verify(request:WebhookRequest, secretRef:SecretRef):VerificationResult; }
interface WebhookSigner { sign(envelope:WebhookEnvelope, secretRef:SecretRef):SignedWebhook; }
interface WebhookDispatcher { send(endpoint:WebhookEndpoint,envelope:WebhookEnvelope):Promise<DeliveryResult>; }
```

## Envelope
Every webhook has event type/version, delivery ID, occurred time, tenant/application context where allowed, source ID/version and payload schema reference. Signatures cover a canonical serialization plus timestamp; replay windows are enforced.

## Outbound flow
```text
Domain event
 → Integrations subscription
 → durable delivery job
 → signer
 → @stackra/http
 → endpoint
 → response classification
 → retry/DLQ
```
Inbound flow verifies signature before parsing business payload and creates an idempotent delivery record.

## Security/reliability
Secrets remain in secret references. SSRF protections restrict destinations. Redirects are disabled or explicitly revalidated. Retry uses bounded exponential backoff and jitter. Success requires an accepted status range; 4xx/5xx classification is explicit.

## Testing
Golden signature vectors, timestamp/replay protection, malformed payloads, SSRF/redirect handling, idempotency, retry/DLQ, timeout/cancellation and real NestJS/controller E2E.
