# Terraform and Docker Generation Standard

## cloud.yaml is the deployable metadata contract

Every directory under `apps/*`, `workers/*`, and `services/*` that is deployable
must contain `cloud.yaml`.

It declares:

- deployment identity
- runtime
- source path
- brand
- routing
- capabilities
- non-secret environment values
- observability
- optional Docker build metadata

Secrets never belong in `cloud.yaml`.

## Terraform

Every deployable receives:

```text
infrastructure/terraform/deployables/<slug>/
├── main.tf
├── variables.tf
└── versions.tf
```

These are thin ownership modules. Shared infrastructure implementations remain
under `infrastructure/terraform/modules`.

The root Terraform stack remains catalog-driven and authoritative for
composition.

## Docker

Only manifests with:

```yaml
docker:
  enabled: true
```

participate in local Docker Compose generation.

Cloudflare Workers, Vite asset applications, and Expo applications are not
automatically converted into Docker services.

Generate:

```bash
pnpm run docker:compose
```

Output:

```text
infrastructure/.generated/docker-compose.yml
```

The generated file is disposable, gitignored, and must not be hand-edited. See
[`infrastructure/.generated/README.md`](../../infrastructure/.generated/README.md).

## Internal service networking

Docker Compose does not publish service ports to the host by default. Containers
communicate using Docker DNS and the service name.

Example:

```text
http://identity:3000
http://iam:3000
```

A developer may add explicit host mappings in a local override file.
