# =============================================================================
# @file infrastructure/terraform/modules/cloudflare/orchestrator/main.tf
# @description Durable Cloudflare resources for the Infrastructure Orchestrator.
# @security No Terraform execution credentials are stored in this module.
# @remarks The Worker/Container image is deployed through Wrangler/CI. Terraform
#   owns durable D1 and Workflow resources and their identifiers.
# =============================================================================

resource "cloudflare_d1_database" "jobs" {
  account_id = var.account_id
  name       = var.database_name
}

resource "cloudflare_workflow" "terraform_execution" {
  account_id    = var.account_id
  workflow_name = var.workflow_name
  class_name    = var.workflow_class_name
  script_name   = var.worker_script_name
}
