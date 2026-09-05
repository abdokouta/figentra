# Routing and Upstreams

## Resolution order

`host -> environment -> application -> route -> service -> upstream transport`.

Registry metadata is authoritative for public application/route metadata. The Gateway must reject unknown, ambiguous, disabled, expired, or environment-mismatched routes.

## Route record

Every route has: applicationId, serviceId, environment, host pattern, path pattern, methods, authentication mode, required capability, timeout, retry policy, body limit, cache policy, rate-limit policy, upstream transport, streaming flag, webhook flag, and version.

## Upstreams

1. Cloudflare Service Binding for Worker-to-Worker traffic.
2. Authenticated HTTPS for NestJS containers.
3. No arbitrary origin supplied by request data.

HTTPS upstream authentication uses service credentials/mTLS or the platform's approved service-authentication mechanism; credentials are never exposed to clients.

## Route precedence

Exact host/application matches precede explicit route matches; ambiguous matches fail closed. A route cannot silently fall back to another application or service.

## Health

Gateway health checks its own runtime. Upstream readiness is evaluated per route only when required. Public health endpoints must not expose internal dependency topology.

## Upstream connection

Construct only from trusted Registry/binding metadata. Apply deadline propagation, bounded retries for safe operations, response-size/streaming rules, and error translation.

## Origin protection

Origin addresses, binding names, credentials, internal service headers, registry internals and infrastructure identifiers are never returned to clients.
