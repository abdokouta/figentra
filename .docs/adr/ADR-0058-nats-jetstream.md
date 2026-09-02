# ADR-0058 — NATS JetStream

**Status:** Accepted

NATS JetStream is the durable event plane. Core NATS may be used for explicitly
bounded ephemeral request/reply. Production JetStream streams and consumers are
Terraform-managed. Target delivery is at-least-once; consumers are idempotent.
