# =============================================================================
# Terraform state backend — S3 + DynamoDB lock (spec 15 §6)
# =============================================================================
#
# One state per environment via Terraform WORKSPACES: the workspace name
# (development | staging | production) is folded into the state key by
# `workspace_key_prefix`, giving:
#
#     s3://figentra-terraform-state/env/<workspace>/root.tfstate
#
# Select the environment before any plan/apply:
#     terraform workspace select development # or staging | production
#
# The state bucket + lock table are DURABLE infra that must exist BEFORE the
# first `terraform init` — they are created by a one-time bootstrap (a separate
# root under environments/bootstrap/, or by hand) and are never destroyed by a
# normal apply. `terraform.tfstate` is NEVER committed (see .gitignore).
#
# Governance: spec 15 §6 · AGENTS.md (Terraform owns durable infra).
# =============================================================================

terraform {
  backend "s3" {
    bucket               = "figentra-terraform-state"
    key                  = "root.tfstate"
    workspace_key_prefix = "env" # -> env/<workspace>/root.tfstate
    region               = "us-east-1"
    encrypt              = true
    use_lockfile         = true # S3-native state locking (replaces the deprecated dynamodb_table arg)
  }
}
