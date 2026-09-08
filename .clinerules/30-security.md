# Cline Rule: Security and Tenancy

## Authentication and authorization
Identity answers who is authenticated. IAM answers whether a principal may act. Monetization answers whether a commercial capability is available. Do not combine these authorities.

Gateway authentication/token prevalidation is defense in depth. Services remain authoritative and must safely handle direct/internal ingress. Never trust client-supplied `X-User`, `X-Principal`, `X-Tenant`, `X-Role`, `X-Permissions`, or authorization-decision headers.

## Tenant isolation
Resolve tenant context from a trusted identity/context mechanism, validate membership and tenant lifecycle, and enforce tenant isolation in every applicable query and mutation. Client tenant headers are hints only.

## Secrets
Production secrets use AWS Secrets Manager or an explicitly approved secret provider. Never put secrets in Git, Docker images, Registry metadata, logs, manifests, frontend bundles, Terraform source, or client-visible configuration.

## Webhooks and integrations
Verify provider signatures using the raw request body before parsing where the provider requires it. Keep provider credentials and OAuth secrets inside the Integrations boundary. Apply SSRF/egress controls to outbound integrations.

## Least privilege
Every runtime role has only the IAM permissions it needs. Separate deploy, runtime, migration and administrative permissions where practical. Do not use broad `*` permissions for convenience.

## Data protection
Encrypt data in transit and at rest. Minimize sensitive data in logs and events. Redact credentials, tokens, authorization headers, secrets and unnecessary personal data.

## Audit
Security-sensitive and governance-relevant business actions produce explicit durable Audit records through the Audit contract. Operational logs are not audit records.

## Frontend
Never put privileged credentials or service secrets in SPA code. Browser tokens and public configuration must be intentionally scoped and validated.
