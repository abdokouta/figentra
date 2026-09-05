# IAM Service Plan

Canonical production plan set: architecture, implementation, API, PostgreSQL data model, NATS/events, jobs/scheduling, security/authorization, observability, testing, and deployment/operations.

IAM is the sole authorization authority. It does not import Identity persistence/provider SDKs, does not own tenant lifecycle, and does not use Supabase/Clerk organizations or permissions as its source of truth.