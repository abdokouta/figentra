# =============================================================================
# @file outputs.tf
# @description Stable identifiers consumed by Wrangler/CI rendering.
# =============================================================================

output "database_id" {
  description = "D1 database identifier for orchestrator job state."
  value       = cloudflare_d1_database.jobs.id
}

output "workflow_id" {
  description = "Cloudflare Workflow identifier."
  value       = cloudflare_workflow.terraform_execution.id
}

output "workflow_name" {
  description = "Cloudflare Workflow name."
  value       = cloudflare_workflow.terraform_execution.name
}
