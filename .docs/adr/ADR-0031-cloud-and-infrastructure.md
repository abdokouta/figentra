# ADR-0031 — Cloudflare Infrastructure Boundary

## Status

Accepted.

## Decision

Cloudflare is the default edge/runtime platform for stateless Workers,
application registry, gateway and infrastructure orchestration. Cloudflare
Containers are used where a Linux process/runtime is required.

Terraform provisions durable infrastructure and produces identifiers consumed by
generated runtime configuration. Secrets are injected through the approved
secret-management system and never committed to manifests.

## Consequences

The platform can use Cloudflare-native primitives without forcing every service
into a Worker runtime.
