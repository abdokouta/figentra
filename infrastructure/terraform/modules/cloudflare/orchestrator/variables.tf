# =============================================================================
# @file variables.tf
# @description Inputs for Infrastructure Orchestrator durable resources.
# =============================================================================

variable "account_id" {
  description = "Cloudflare account identifier owning the orchestrator."
  type        = string
}

variable "database_name" {
  description = "D1 database name for orchestration job state."
  type        = string
}

variable "workflow_name" {
  description = "Cloudflare Workflow name."
  type        = string
}

variable "workflow_class_name" {
  description = "Exported Workflow class name in the orchestrator Worker."
  type        = string
}

variable "worker_script_name" {
  description = "Cloudflare Worker script that contains the Workflow class."
  type        = string
}

