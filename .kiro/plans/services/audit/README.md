# Audit Service Plan

Canonical production plan set: architecture, implementation, API, PostgreSQL data model, NATS/events, jobs/scheduling, security/authorization, observability, testing, and deployment/operations.

Audit is the durable governance-evidence plane. It is not application logging, OpenTelemetry, tracking, analytics, authorization or notification delivery. Records are immutable and tenant-isolated.