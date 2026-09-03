# ADR-0083 — Explicit Cloud Deployment Sources

## Status

Accepted.

## Context

Implicit filesystem discovery makes deployment enrollment accidental: creating a
`cloud.yaml` in a directory can silently change the deployment catalog. This is
unsafe for an enterprise platform with gradual rollout and controlled production
enrollment.

## Decision

The root `cloud.yaml` explicitly declares local deployment source paths:

```yaml
paths:
  - "apps/*"
  - "services/*"
  - "workers/*"
```

The collector processes only these paths. Every selected directory MUST contain
its own `cloud.yaml`. A source outside the root `paths` list is not deployable
through the generated catalog.

External repositories are separately declared under `repos:`. They are catalog
sources, not npm/pnpm workspace members.

Products remain composition/ownership metadata and do not perform filesystem
discovery.

## Boundary with npm workspaces

`pnpm-workspace.yaml` or npm `workspaces` defines package-manager membership.
Root `cloud.yaml` defines deployment-source enrollment. The two may overlap but
must never be treated as the same configuration.

## Catalog pipeline

```text
cloud.yaml
  -> explicit local paths + explicit external repos
  -> per-source cloud.yaml validation
  -> infrastructure/.generated/catalog.json
  -> Terraform / Docker / CI generators
```

`catalog.json` is generated and must never become a manually maintained source
of truth. It lives under `infrastructure/.generated/` — machine-owned +
gitignored (see
[`infrastructure/.generated/README.md`](../../infrastructure/.generated/README.md)).

## Consequences

- Deployment enrollment is auditable and reviewable.
- Experimental directories can remain outside deployment simply by not being
  enrolled.
- Glob patterns allow gradual enrollment without duplicating every path.
- Missing manifests fail the collector instead of being silently skipped.
