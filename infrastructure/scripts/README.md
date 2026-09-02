# Infrastructure Scripts

Infrastructure-wide generators and validators live here when they are consumed
by more than one infrastructure subsystem.

## Current scripts

### `collect-cloud-yaml.mjs`

Discovers local and configured external deployables from `cloud.yaml` and emits:

`infrastructure/catalog.json`

Terraform and Docker both consume this generated catalog.

Docker-only scripts belong in `infrastructure/docker/scripts/`.
Terraform-only scripts belong in `infrastructure/terraform/scripts/`.

No script in this directory performs a production apply.
