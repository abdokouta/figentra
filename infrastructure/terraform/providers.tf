# =============================================================================
# Provider configuration
# =============================================================================
#
# Credentials arrive as TF_VAR_* environment variables exported from Doppler at
# orchestration time (spec 15 §9) — never tfvars-on-disk, never committed:
#
#     doppler run --project figentra-workspace --config <env> -- \
#         terraform -chdir=infrastructure/terraform apply
#
# Multi-brand: Cloudflare v5 scopes account/zone per-resource, so ONE token with
# access to both the figentra + academorix accounts covers every brand — no
# per-brand provider alias needed. (If the brands ever live under separate
# Cloudflare logins, split into aliased providers + pass them per-brand.)
# =============================================================================

provider "cloudflare" {
  # v5: account/zone scoping is per-resource; only the token is provider-level.
  api_token = var.cloudflare_api_token
}

provider "supabase" {
  access_token = var.supabase_access_token
}

provider "betteruptime" {
  api_token = var.better_stack_api_token
}

# --- Mobile providers -------------------------------------------------------
# EAS. Falls back to EXPO_TOKEN / EXPO_ACCOUNT_NAME env vars when the TF vars are
# empty, so `doppler run -- terraform ...` injects them without tfvars-on-disk.
provider "expo" {
  token        = var.expo_token != "" ? var.expo_token : null
  account_name = var.expo_account_name != "" ? var.expo_account_name : null
}

# Firebase/GCP. Empty credentials -> Application Default Credentials (gcloud /
# GOOGLE_APPLICATION_CREDENTIALS). google + google-beta share one credential.
provider "google" {
  credentials = var.google_credentials != "" ? var.google_credentials : null
}

provider "google-beta" {
  credentials = var.google_credentials != "" ? var.google_credentials : null
}


/** Optional NATS JetStream provider; resources are disabled when NATS is not configured. */
provider "jetstream" {
  servers     = var.nats_servers
  credentials = var.nats_credentials
  dynamic "tls" {
    for_each = var.nats_ca_file_data == null ? [] : [var.nats_ca_file_data]
    content {
      ca_file_data = tls.value
    }
  }
}
