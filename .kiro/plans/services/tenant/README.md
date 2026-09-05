# Tenant Service Plan

Canonical production plan set: architecture, implementation, API, PostgreSQL data model, NATS/events, jobs/scheduling, security/authorization, observability, testing, and deployment/operations.

Tenant is the tenancy control plane. It owns tenant lifecycle, organizations, memberships, domains and tenant settings. Product services own their own resource hierarchies; IAM owns authorization.