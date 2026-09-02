#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"
command -v terraform >/dev/null || { echo "ERROR: terraform CLI is required" >&2; exit 1; }

terraform -chdir=infrastructure/terraform fmt -check -recursive
terraform -chdir=infrastructure/terraform init -backend=false
terraform -chdir=infrastructure/terraform validate

for env in development staging production; do
  terraform -chdir=infrastructure/terraform workspace select "$env" >/dev/null 2>&1 || terraform -chdir=infrastructure/terraform workspace new "$env" >/dev/null
done
