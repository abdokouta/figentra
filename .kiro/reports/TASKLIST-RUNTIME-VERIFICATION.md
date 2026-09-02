# Figentra Runtime Verification & Production Readiness — Current Batch

> Installation is intentionally excluded from this batch per request.
> No `--legacy-peer-deps` or `--force` is permitted.
> Real external infrastructure/security gates are checked only after actual execution.

## 01 Repository verification
- [ ] Run static repository consistency checks
- [ ] Verify all package exports
- [ ] Verify all TypeScript/build configurations
- [ ] Verify all Vitest locations and setup files
- [ ] Verify Worker source/test organization
- [ ] Verify service source/test organization
- [ ] Verify manifest/catalog consistency

## 02 Messaging runtime
- [ ] Implement Node NATS connection factory
- [ ] Implement JetStream publisher
- [ ] Implement durable consumer adapter
- [ ] Implement request/reply adapter
- [ ] Implement bounded timeouts
- [ ] Implement payload-size enforcement
- [ ] Implement graceful connection lifecycle
- [ ] Implement NATS unit tests

## 03 Transactional outbox
- [ ] Finalize MikroORM outbox persistence
- [ ] Finalize transactional domain + outbox boundary
- [ ] Finalize row-lock claiming
- [ ] Finalize relay retry scheduling
- [ ] Finalize terminal DLQ handling
- [ ] Finalize relay graceful shutdown
- [ ] Finalize outbox metrics/tracing
- [ ] Add service migration contract

## 04 Audit
- [ ] Finalize event-only application write boundary
- [ ] Finalize canonical audit event consumer
- [ ] Finalize audit idempotency
- [ ] Finalize audit persistence
- [ ] Finalize immutable hash-chain verification
- [ ] Finalize restricted audit database role
- [ ] Finalize retention/archival contract
- [ ] Finalize authorized export
- [ ] Finalize Audit integration tests

## 05 Identity and S2S
- [ ] Finalize service identity model
- [ ] Finalize service credential lifecycle
- [ ] Finalize short-lived service JWT contract
- [ ] Finalize JWKS validation/rotation contract
- [ ] Finalize S2S audience/issuer validation
- [ ] Finalize token exchange contract
- [ ] Finalize delegation/impersonation contract
- [ ] Finalize S2S integration tests

## 06 IAM authorization
- [ ] Finalize S2S authorization API
- [ ] Finalize service permission model
- [ ] Finalize tenant/scope context resolution
- [ ] Finalize authorization guard/interceptor
- [ ] Finalize decision cache/invalidation
- [ ] Finalize deny-by-default behavior
- [ ] Finalize authorization integration tests

## 07 Service event migration
- [ ] Identity event/outbox integration
- [ ] IAM event/outbox integration
- [ ] Tenant event/outbox integration
- [ ] Scope event/outbox integration
- [ ] Policy event/outbox integration
- [ ] Approval event/outbox integration
- [ ] Entitlements event/outbox integration
- [ ] Monetization event/outbox integration
- [ ] Usage event/outbox integration
- [ ] Notifications event/outbox integration

## 08 Worker integration
- [ ] Finalize Gateway messaging boundary
- [ ] Finalize Registry event boundary
- [ ] Finalize Orchestrator event boundary
- [ ] Ensure Cloudflare Workers do not import Node-only NATS transport
- [ ] Finalize Worker contract tests

## 09 Gateway and Registry
- [ ] Finalize Gateway upstream service authentication
- [ ] Finalize Gateway authorization boundary
- [ ] Finalize Gateway correlation propagation
- [ ] Finalize Gateway rate-limit boundary
- [ ] Finalize Registry authenticated registration
- [ ] Finalize Registry application/resource/route/event/permission contracts
- [ ] Finalize generated registry catalog
- [ ] Finalize Gateway/Registry integration tests

## 10 Infrastructure Orchestrator
- [ ] Finalize authenticated Terraform plan API
- [ ] Finalize approval gate
- [ ] Finalize Terraform execution boundary
- [ ] Finalize state locking contract
- [ ] Finalize plan artifact handling
- [ ] Finalize apply protection
- [ ] Finalize rollback contract
- [ ] Finalize Orchestrator integration tests

## 11 Testing
- [ ] Finalize event contract tests
- [ ] Finalize PostgreSQL integration tests
- [ ] Finalize NATS/JetStream integration tests
- [ ] Finalize outbox/relay integration tests
- [ ] Finalize authenticated E2E
- [ ] Finalize authorization E2E
- [ ] Finalize tenant isolation E2E
- [ ] Finalize Portal Playwright critical flows
- [ ] Finalize Landing Page Playwright critical flows

## 12 Reliability and security
- [ ] Finalize duplicate-delivery tests
- [ ] Finalize retry/DLQ tests
- [ ] Finalize NATS outage tests
- [ ] Finalize database outage tests
- [ ] Finalize relay crash/recovery tests
- [ ] Finalize load test scenarios
- [ ] Finalize security regression suite
- [ ] Finalize secret/dependency scanning
- [ ] Finalize production security checklist

## 13 Production readiness
- [ ] Finalize development deployment contract
- [ ] Finalize staging deployment contract
- [ ] Finalize production deployment contract
- [ ] Finalize backups/PITR contract
- [ ] Finalize observability/SLO contract
- [ ] Finalize rollback runbook
- [ ] Finalize disaster recovery runbook
- [ ] Finalize final enterprise gate
