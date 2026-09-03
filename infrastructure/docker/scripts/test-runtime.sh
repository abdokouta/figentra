#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

command -v docker >/dev/null || { echo "ERROR: docker CLI is required" >&2; exit 1; }
docker compose version >/dev/null || { echo "ERROR: docker compose plugin is required" >&2; exit 1; }

ENVIRONMENT="${FIGENTRA_ENV:-development}"
case "$ENVIRONMENT" in
  development|staging) ;;
  production) echo "ERROR: production is not a local Compose runtime" >&2; exit 1 ;;
  *) echo "ERROR: invalid FIGENTRA_ENV=$ENVIRONMENT" >&2; exit 1 ;;
esac

# Every generated artefact lives under infrastructure/.generated/ — machine-
# owned, gitignored, regenerated on demand by the generator scripts.
COMPOSE_FILE="infrastructure/.generated/docker-compose.yml"

node infrastructure/docker/scripts/generate-compose.mjs --environment="$ENVIRONMENT"
docker compose -f "$COMPOSE_FILE" config >/dev/null
docker compose -f "$COMPOSE_FILE" build
docker compose --profile infra -f "$COMPOSE_FILE" up -d
cleanup() { docker compose --profile infra -f "$COMPOSE_FILE" down --remove-orphans; }
trap cleanup EXIT

# Wait for all declared application healthchecks and dependency healthchecks.
for i in $(seq 1 60); do
  if docker compose -f "$COMPOSE_FILE" ps --format json | grep -q '"Health":"unhealthy"'; then
    docker compose -f "$COMPOSE_FILE" ps
    exit 1
  fi
  if ! docker compose -f "$COMPOSE_FILE" ps --format json | grep -q '"Health":"starting"'; then
    break
  fi
  sleep 2
done

docker compose -f "$COMPOSE_FILE" ps
