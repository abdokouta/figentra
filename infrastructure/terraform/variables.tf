# =============================================================================
# Terraform input variables
# =============================================================================
#
# Provider credentials arrive as TF_VAR_* environment variables, exported from
# Doppler at orchestration time (never tfvars-on-disk, never committed):
#
#     doppler run --project figentra-workspace --config dev -- \
#         terraform -chdir=infrastructure/terraform plan
#
# The Doppler key -> TF_VAR mapping (spec 15 §9, secrets are references only):
#     CLOUDFLARE_API_TOKEN     -> TF_VAR_cloudflare_api_token
#     CLOUDFLARE_ACCOUNT_ID    -> TF_VAR_cloudflare_account_id
# #     SUPABASE_ACCESS_TOKEN    -> TF_VAR_supabase_access_token
#     BETTER_STACK_API_TOKEN   -> TF_VAR_better_stack_api_token
#
# AWS credentials (for the S3 backend) are read by the AWS SDK directly from
# AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION — not TF vars.
#
# The active environment is NOT a variable — it is derived from the selected
# Terraform workspace (see locals.tf). Per-env value overrides live in
# environments/<env>.tfvars.
# =============================================================================

variable "cloudflare_api_token" {
  description = "Cloudflare API token (durable infra: zones, DNS, D1, KV, R2, Queues, Workers config)."
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account id that owns the figentra.com zone + Workers/Containers."
  type        = string
}


variable "supabase_access_token" {
  description = "Supabase management API token for project/config provisioning (spec 15 §5)."
  type        = string
  sensitive   = true
  default     = ""
}

variable "better_stack_api_token" {
  description = "Better Stack API token for monitors, heartbeats, status pages (spec 15 §4/§16)."
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_organization_id" {
  description = "Supabase organization id. Empty = skip Supabase project provisioning (the supabase module is gated on this)."
  type        = string
  default     = ""
}

variable "supabase_db_password" {
  description = "Postgres password for the per-env Supabase project. Sourced from Doppler; never committed."
  type        = string
  sensitive   = true
  default     = ""
}

# --- Multi-brand Cloudflare --------------------------------------------------

variable "academorix_cloudflare_account_id" {
  description = "Cloudflare account id that owns the academorix.com zone. Empty = academorix routing not yet provisioned (figentra brand is unaffected). Doppler: ACADEMORIX_CLOUDFLARE_ACCOUNT_ID -> TF_VAR_academorix_cloudflare_account_id."
  type        = string
  default     = ""
}

# --- Mobile: EAS (Expo) ------------------------------------------------------

variable "expo_token" {
  description = "Expo personal/robot access token (EAS). Empty -> the provider reads EXPO_TOKEN from the env. Doppler: EXPO_TOKEN -> TF_VAR_expo_token."
  type        = string
  sensitive   = true
  default     = ""
}

variable "expo_account_name" {
  description = "Expo account (user/organization) name that owns the EAS projects. Empty -> the provider reads EXPO_ACCOUNT_NAME from the env."
  type        = string
  default     = ""
}

# --- Mobile: Firebase / GCP (Approach A — Terraform owns the project) --------

variable "google_credentials" {
  description = "GCP service-account JSON (project-creator + billing.user on the org) for Firebase project provisioning. Empty -> Application Default Credentials. Doppler: GOOGLE_CREDENTIALS -> TF_VAR_google_credentials."
  type        = string
  sensitive   = true
  default     = ""
}

variable "gcp_org_id" {
  description = "GCP organization id that owns the created Firebase projects (figentra org). Empty = standalone projects (no org)."
  type        = string
  default     = ""
}

variable "gcp_billing_account" {
  description = "GCP billing account id linked to each created Firebase project. Empty = unlinked (project creation may fail if the org requires billing)."
  type        = string
  default     = ""
}

/**
 * NATS JetStream endpoint used for post-cluster stream provisioning.
 *
 * The endpoint and credentials are supplied through Doppler/CI. The cluster
 * itself is managed by the selected NATS provider/control plane.
 */
variable "nats_servers" {
  description = "Authenticated NATS server endpoint used by the JetStream Terraform provider."
  type        = string
  default     = ""
}

/** NATS 2.0 credentials used only by Terraform's JetStream provider. */
variable "nats_credentials" {
  description = "Sensitive NATS 2.0 credentials for JetStream provisioning."
  type        = string
  sensitive   = true
  default     = ""
}

/** Optional NATS TLS CA PEM. */
variable "nats_ca_file_data" {
  description = "Optional NATS TLS CA certificate PEM."
  type        = string
  sensitive   = true
  default     = null
}
