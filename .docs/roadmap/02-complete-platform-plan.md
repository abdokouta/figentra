# Complete Figentra Platform Plan

## Stage 0 — Repository/Foundation

- [ ] pnpm workspace
- [ ] Turbo pipeline
- [ ] TypeScript standards
- [ ] lint/typecheck/test
- [ ] package boundaries
- [ ] official scaffolds
- [ ] CI baseline
- [ ] Terraform baseline

## Stage 1 — Identity/Security Kernel

- [ ] Supabase Auth adapter
- [ ] canonical Identity schema
- [ ] identity lifecycle
- [ ] provider links
- [ ] Principal schema
- [ ] service accounts
- [ ] credential schema
- [ ] API keys
- [ ] OAuth clients
- [ ] service identity
- [ ] M2M OAuth
- [ ] JWT/JWKS
- [ ] token exchange
- [ ] delegation
- [ ] impersonation
- [ ] security events

## Stage 2 — IAM

- [ ] permission model
- [ ] roles
- [ ] role assignments
- [ ] grants
- [ ] policy model
- [ ] policy engine decision
- [ ] authorization API
- [ ] batch authorization
- [ ] cache
- [ ] invalidation
- [ ] authorization performance tests

## Stage 3 — Tenant and Scope

- [ ] Tenant model
- [ ] Supabase Auth mapping
- [ ] tenant lifecycle
- [ ] dynamic Scope Type
- [ ] Scope Node
- [ ] Scope relation
- [ ] scope membership
- [ ] scope traversal
- [ ] inheritance
- [ ] cross-tenant controls

## Stage 4 — Platform Control Plane

- [ ] Application Registry
- [ ] manifest schema
- [ ] application versioning
- [ ] resource/action registry
- [ ] decorator/scanner
- [ ] registry API
- [ ] domain service
- [ ] custom domains
- [ ] DNS verification
- [ ] certificates
- [ ] routing

## Stage 5 — Commercial

- [ ] billing account
- [ ] plans
- [ ] prices
- [ ] subscriptions
- [ ] invoices
- [ ] Stripe adapter
- [ ] Paddle adapter
- [ ] entitlement model
- [ ] usage events
- [ ] meters
- [ ] quotas
- [ ] reconciliation

## Stage 6 — Event/Webhook Infrastructure

- [ ] event envelope
- [ ] schema registry
- [ ] outbox
- [ ] queue transport matrix
- [ ] consumer idempotency
- [ ] DLQ
- [ ] replay
- [ ] Convoy deployment
- [ ] inbound webhook adapters
- [ ] outbound webhook subscriptions

## Stage 7 — Platform Capabilities

- [ ] Notifications
- [ ] Integrations/App Store
- [ ] Workflow
- [ ] Audit
- [ ] Files
- [ ] Search
- [ ] Reporting

## Stage 8 — Frontend

- [ ] official HeroUI Vite portal
- [ ] official HeroUI Vite landing page
- [ ] auth integration
- [ ] theme/branding
- [ ] permission-aware UI
- [ ] route/resource conventions
- [ ] Query/State/HTTP integration

## Stage 9 — Runtime/Infrastructure

- [ ] Cloudflare gateway
- [ ] Cloudflare registry
- [ ] NestJS deployment targets
- [ ] Cloudflare Containers evaluation
- [ ] AWS ECS fallback
- [ ] Supabase
- [ ] Redis
- [ ] queues
- [ ] secrets
- [ ] observability
- [ ] Terraform environments

## Stage 10 — Enterprise Hardening

- [ ] threat model refresh
- [ ] penetration testing
- [ ] disaster recovery
- [ ] backup/restore
- [ ] key rotation drills
- [ ] tenant isolation tests
- [ ] authorization fuzzing
- [ ] audit retention
- [ ] compliance controls
- [ ] SLOs
- [ ] incident response
- [ ] business continuity
