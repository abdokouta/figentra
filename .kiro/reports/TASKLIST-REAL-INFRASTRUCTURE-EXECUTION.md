# Figentra Real Infrastructure Execution — Current Batch

## Execution policy

- Dependency installation is intentionally excluded from this batch.
- `--legacy-peer-deps` and `--force` are prohibited.
- Every gate below must be executed against the real target environment before it is marked complete.
- No simulated success, placeholder credential, fake provider, or source-only assertion counts as completion.

## 01 — Runtime prerequisites

- [ ] Run with Node 24.18.x from `.nvmrc`.
- [ ] Verify Terraform >= 1.9 and < 2.0.
- [ ] Verify Docker Engine/Compose availability.
- [ ] Verify Wrangler authentication.
- [ ] Verify Cloudflare credentials and account access.
- [ ] Verify Supabase management/database credentials.
- [ ] Verify NATS cluster credentials and TLS material.
- [ ] Verify production secret provider access.

## 02 — Development runtime

- [ ] Start real local NATS JetStream.
- [ ] Start real PostgreSQL.
- [ ] Apply service migrations.
- [ ] Start Audit against PostgreSQL.
- [ ] Execute Audit event ingestion through NATS.
- [ ] Verify outbox publication.
- [ ] Verify duplicate-event idempotency.
- [ ] Verify retry and DLQ behavior.
- [ ] Verify audit hash-chain verification.

## 03 — Staging infrastructure

- [ ] Provision staging Terraform state/backend.
- [ ] Provision NATS JetStream staging resources.
- [ ] Provision PostgreSQL/Supabase staging resources.
- [ ] Provision Identity JWKS issuer.
- [ ] Provision IAM authorization resources.
- [ ] Provision Cloudflare Worker resources.
- [ ] Provision WAF/rate-limit resources.
- [ ] Provision observability resources.
- [ ] Render Wrangler IDs from Terraform outputs.

## 04 — Staging application verification

- [ ] Deploy Identity.
- [ ] Deploy IAM.
- [ ] Deploy Audit.
- [ ] Deploy remaining Nest services.
- [ ] Deploy Gateway.
- [ ] Deploy Registry.
- [ ] Deploy Infrastructure Orchestrator.
- [ ] Deploy Portal.
- [ ] Deploy Landing Page.
- [ ] Verify service-to-service JWT authentication.
- [ ] Verify IAM authorization.
- [ ] Verify event propagation across services.
- [ ] Verify Gateway routing.
- [ ] Verify Registry registration and resolution.
- [ ] Verify Orchestrator approval/plan/apply boundary.

## 05 — Reliability

- [ ] Execute NATS outage drill.
- [ ] Execute PostgreSQL outage drill.
- [ ] Execute relay crash/restart drill.
- [ ] Execute duplicate-delivery test.
- [ ] Execute DLQ redrive test.
- [ ] Execute credential rotation test.
- [ ] Execute service restart/recovery test.
- [ ] Execute load test.
- [ ] Execute sustained/soak test.

## 06 — Security

- [ ] Run secret scanning.
- [ ] Run dependency vulnerability scanning.
- [ ] Run container scanning.
- [ ] Verify NATS ACL isolation.
- [ ] Verify JWT issuer/audience/expiry/signature enforcement.
- [ ] Verify JWKS rotation.
- [ ] Verify tenant isolation.
- [ ] Verify IAM deny-by-default.
- [ ] Verify registry registration authorization.
- [ ] Verify gateway SSRF/routing controls.
- [ ] Execute penetration test.

## 07 — Production

- [ ] Review production Terraform plan.
- [ ] Obtain production change approval.
- [ ] Apply production infrastructure.
- [ ] Deploy production services.
- [ ] Deploy production Workers.
- [ ] Deploy production Portal/Landing Page.
- [ ] Execute production smoke tests.
- [ ] Verify production event flow.
- [ ] Verify production observability/SLOs.
- [ ] Verify production backups/PITR.
- [ ] Execute production rollback drill.
- [ ] Execute disaster recovery rehearsal.

## 08 — Final enterprise gate

- [ ] Full monorepo build.
- [ ] Full typecheck.
- [ ] Full Oxlint.
- [ ] Full Prettier check.
- [ ] Full Vitest suite.
- [ ] Contract suite.
- [ ] Integration suite.
- [ ] Playwright suite.
- [ ] Load/reliability suite.
- [ ] Security suite.
- [ ] Production deployment verification.
- [ ] Rollback verification.
- [ ] DR verification.
- [ ] Architecture/standards consistency verification.
