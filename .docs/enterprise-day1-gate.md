# Enterprise Day-1 Gate

A repository is not production-ready merely because its source tree is complete.
The following gates must pass in the real target accounts.

## Static/repository gates

- [x] Architecture ADRs accepted
- [x] Engineering standards present
- [x] Single deployment catalog
- [x] Terraform capability modules only
- [x] Docker generator derives from the catalog
- [x] Worker route modules
- [x] Identity/IAM contracts
- [x] NATS/event/outbox contracts
- [x] Standard test layout
- [x] Documentation gate
- [x] Dependency policy
- [x] Secret scanning configuration
- [x] Terraform policy

## Real infrastructure gates

- [ ] Cloudflare production resources provisioned
- [ ] WAF policy deployed
- [ ] Production rate limiting deployed
- [ ] Worker/Service Bindings verified
- [ ] D1 migrations applied
- [ ] Supabase production project verified
- [ ] Supabase JWKS verification verified
- [ ] NATS production cluster provisioned
- [ ] NATS TLS and credentials verified
- [ ] Production secret manager configured
- [ ] Terraform state/locking verified
- [ ] Infrastructure Orchestrator plan verified
- [ ] Infrastructure Orchestrator apply verified
- [ ] Rollback drill completed

## Security gates

- [ ] Service identity verified
- [ ] IAM authorization verified
- [ ] Deny-by-default verified
- [ ] SSRF controls verified
- [ ] WAF/rate-limit bypass testing completed
- [ ] Dependency vulnerability scan passed
- [ ] Container scan passed
- [ ] DAST passed
- [ ] Penetration test passed

## Reliability gates

- [ ] NATS retry/DLQ test
- [ ] Outbox failure/replay test
- [ ] Gateway timeout/retry test
- [ ] Registry failure test
- [ ] Terraform runner failure test
- [ ] Backup/restore test
- [ ] Disaster recovery rehearsal
- [ ] Load test
- [ ] SLO/alert verification
