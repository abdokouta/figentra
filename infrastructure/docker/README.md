# Figentra Docker Infrastructure

Docker Compose is the local/integration runtime generated from the canonical
deployment catalog. It is not a production deployment authority.

## Source pipeline

```text
root cloud.yaml
  -> explicit paths
  -> per-deployable cloud.yaml
  -> infrastructure/catalog.json
  -> infrastructure/docker/scripts/generate-compose.mjs
  -> docker-compose.generated.yml
```

Only explicitly enrolled local deployables with `docker.enabled: true` are
included. Workers, Vite assets, and mobile apps are not implicitly Dockerized.

## Environments

Use the canonical names `development`, `staging`, and `production`. Compose is
intended for local/integration operation; production secrets and credentials are
never generated into the Compose artifact.

## Commands

```bash
make -C infrastructure/docker compose ENV=development
make -C infrastructure/docker compose-validate ENV=development
make -C infrastructure/docker compose-config ENV=development
make -C infrastructure/docker compose-up ENV=development
make -C infrastructure/docker compose-down ENV=development
```

Infrastructure dependencies (PostgreSQL, NATS, Redis) are declared in
`docker.yaml`. Application containers derive their build context, image target,
health contract, environment values, and dependency edges from their own
`cloud.yaml`.
