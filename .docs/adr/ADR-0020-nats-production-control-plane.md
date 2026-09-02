# ADR-0020 — Managed NATS Production Control Plane

## Status

Accepted for V1.

## Decision

Use NATS as the Figentra internal messaging protocol and use a managed NATS
control plane such as Synadia Cloud/NGS for production V1 rather than operating
a stateful NATS cluster on Cloudflare Workers.

Use separate NATS accounts/environments and dedicated per-service credentials.
Use JetStream for durable platform events.

Terraform manages JetStream assets after the authenticated NATS endpoint exists.
The application remains portable because service code uses standard NATS clients
and the NestJS microservices transport abstraction.

## Consequences

- Faster enterprise production readiness.
- HA/multi-region operations are delegated to a NATS specialist.
- NATS credentials still require secure lifecycle management.
- The Terraform JetStream provider is an additional provider dependency.
- A future self-hosted NATS migration remains possible.
