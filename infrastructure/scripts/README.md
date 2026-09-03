# Infrastructure Scripts

Infrastructure-wide generators and validators live here when they are consumed
by more than one infrastructure subsystem.

## Current scripts

### `collect-cloud-yaml.mjs`

Discovers local and configured external deployables from `cloud.yaml` and emits:

`infrastructure/.generated/catalog.json`

Terraform and Docker both consume this generated catalog. The `.generated/`
folder is machine-owned + gitignored; regenerate with `pnpm run catalog` before
every Terraform plan or Docker Compose generation.

Docker-only scripts belong in `infrastructure/docker/scripts/`.
Terraform-only scripts belong in `infrastructure/terraform/scripts/`.

No script in this directory performs a production apply.
