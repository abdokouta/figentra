---
name: figentra-release-gate
description: Gate a Figentra release for build integrity, migrations, security, observability, deployment, rollback, SLOs, and operational readiness.
---

# Figentra Release Gate

A release is a controlled production change, not a successful build.

Verify:
- immutable build artifacts and dependency lock integrity;
- database migration ordering, compatibility and rollback/forward strategy;
- secrets references and environment configuration;
- health/readiness, graceful shutdown and autoscaling;
- API and event compatibility;
- queue consumer idempotency and retry/DLQ behavior;
- scheduler singleton/lease behavior;
- telemetry, dashboards, alerts and SLO impact;
- backup/restore and disaster-recovery implications;
- canary/rollout strategy and rollback procedure;
- operator runbooks and post-deploy verification.

Separate `deploy`, `migrate`, `verify`, `promote`, and `rollback`. Never execute a production deployment merely because the code compiles.