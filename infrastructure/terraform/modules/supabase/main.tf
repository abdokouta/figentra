# =============================================================================
# module: supabase — one Postgres project per environment (spec 14 + 15 §5)
# =============================================================================
#
# Provisions ONE Supabase project per environment (figentra-<env>). Container
# services (iam, tenant, monetization) each own a SCHEMA within it and reach
# only their own data (spec 01 §2, 14) — schema isolation is managed by each
# service's migrations at runtime, NOT by Terraform.
#
# GATED: the project is only created when var.organization_id is non-empty, so
# `terraform plan` stays clean before Supabase is configured. Provide the org id
# + db password via Doppler (TF_VAR_supabase_organization_id / _db_password).
#
# VERIFY resource args against supabase ~> 1.0 before init (spec 15 §5) — the
# provider's `supabase_project` schema (region enum, instance size) shifts.
# COST: a project per env is billed; consolidate to fewer projects if needed.
# =============================================================================

variable "organization_id" {
  description = "Supabase organization id. Empty string disables provisioning."
  type        = string
  default     = ""
}

variable "database_password" {
  description = "Postgres password for the project (from Doppler; sensitive)."
  type        = string
  sensitive   = true
  default     = ""
}

variable "region" {
  description = "Supabase region for the project."
  type        = string
  default     = "us-east-1"
}

variable "env" {
  description = "Environment (development | staging | production) — names the project."
  type        = string
}

resource "supabase_project" "this" {
  count = var.organization_id != "" ? 1 : 0

  organization_id   = var.organization_id
  name              = "figentra-${var.env}"
  database_password = var.database_password
  region            = var.region
}

output "project_ref" {
  description = "Supabase project ref/id (null when disabled). Consumed by service DATABASE_URL config."
  value       = length(supabase_project.this) > 0 ? supabase_project.this[0].id : null
}
