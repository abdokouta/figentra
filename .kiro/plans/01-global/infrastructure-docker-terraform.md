---
authored_by: kiro
authored_at: 2026-09-03
status: Planned
---

# Platform Infrastructure — Docker + Terraform

## Purpose

Make deployment infrastructure reproducible from day one. Docker defines deterministic build/runtime artifacts; Terraform defines durable cloud infrastructure and environment composition.

## Required coverage

Docker/Terraform planning applies to:

- NestJS services and supporting runtime images.
- Data-plane workers where container deployment is used; Cloudflare Worker deployment remains provider-native and is not forced into Docker.
- OpenTelemetry Collector and monitoring stack.
- NATS, databases, caches, object storage integrations, search, and supporting infrastructure where self-hosted or provisioned by cloud resources.
- Networks, IAM, secrets references, DNS, certificates, queues/streams, storage, backups, and observability infrastructure.

## Rules

- Development, staging, and production are separate Terraform environments/states.
- Reusable Terraform modules define stable interfaces; environment roots compose them.
- Remote state is encrypted, locked, access-controlled, and backed up.
- No credentials committed to Terraform or Docker files.
- Docker images are immutable, pinned, scanned, signed where supported, and promoted between environments rather than rebuilt per environment.
- Runtime configuration is injected at deploy time through approved secret/config mechanisms.
- Terraform manages infrastructure; application migrations remain application release responsibilities.
- Manual changes require an explicit break-glass record and reconciliation back into code.

## Repository layout

```text
infra/
├── docker/
│   ├── base/
│   ├── services/
│   ├── workers/
│   └── observability/
├── compose/
│   ├── development.yml
│   └── observability.yml
└── terraform/
    ├── modules/
    └── environments/
        ├── development/
        ├── staging/
        └── production/
```

## Security and reliability

Private networking, least privilege, encryption in transit/at rest, image vulnerability scanning, resource limits, health checks, graceful shutdown, backup/restore, disaster recovery, and environment isolation are mandatory.

## Testing

Docker build/smoke tests; Terraform formatting, validation, plan, policy/security checks; ephemeral environment integration tests; restore drills; drift detection; and deployment rollback tests.

## Exit criteria

Every deployable platform component has a declared packaging/deployment boundary, every durable infrastructure dependency is Terraform-managed or explicitly documented as an external managed service, and environments can be recreated without manual architectural intervention.
