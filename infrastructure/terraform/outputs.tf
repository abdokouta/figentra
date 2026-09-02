# =============================================================================
# outputs.tf — resource ids for the Wrangler / EAS side + operational reference
# =============================================================================
#
# The app pipelines read these to render each deployable's wrangler.jsonc
# bindings (d1_databases, kv_namespaces, queues, r2_buckets), wire cross-service
# URLs, link EAS projects (`eas init --id`), and upload FCM push credentials.
# Emit as JSON with:
#     terraform -chdir=infrastructure/terraform output -json
#
# The zone-bound modules (dns/worker/container) are per-brand (module.X[brand]),
# so their outputs are aggregated across brands below.
# =============================================================================

output "zone_ids" {
  description = "brand -> Cloudflare zone id (figentra.com, academorix.com, ...)."
  value       = { for brand, m in module.dns : brand => m.zone_id }
}

output "d1_database_ids" {
  description = "slug -> D1 database id."
  value       = module.d1.database_ids
}

output "kv_namespace_ids" {
  description = "slug -> Workers KV namespace id."
  value       = module.kv.namespace_ids
}

output "queue_names" {
  description = "slug -> Queue name."
  value       = module.queue.queue_names
}

output "r2_bucket_names" {
  description = "slug -> R2 bucket name."
  value       = module.r2.bucket_names
}

output "worker_custom_domains" {
  description = "slug -> bound hostname (workers + assets, all brands)."
  value       = merge([for brand, m in module.worker : m.custom_domains]...)
}

output "container_custom_domains" {
  description = "slug -> bound hostname (containers, all brands)."
  value       = merge([for brand, m in module.container : m.custom_domains]...)
}

output "supabase_project_ref" {
  description = "Per-env Supabase project ref (null until configured)."
  value       = module.supabase.project_ref
}

output "service_urls" {
  description = "slug -> public https URL (cross-service base URLs; injected as peer env vars)."
  value       = local.service_urls
}

# --- Mobile -----------------------------------------------------------------
output "expo_app_ids" {
  description = "slug -> EAS project id (feed into `eas init --id`)."
  value       = module.expo.app_ids
}

output "firebase_project_ids" {
  description = "slug -> Firebase/GCP project id."
  value       = module.firebase.project_ids
}

output "firebase_android_app_ids" {
  description = "slug -> Firebase Android app id."
  value       = module.firebase.android_app_ids
}

output "firebase_apple_app_ids" {
  description = "slug -> Firebase Apple app id."
  value       = module.firebase.apple_app_ids
}

output "fcm_sender_emails" {
  description = "slug -> FCM v1 sender service-account email."
  value       = module.firebase.fcm_sender_emails
}

output "fcm_sender_keys" {
  description = "slug -> base64 FCM v1 sender key JSON (upload to EAS/backend). Sensitive."
  value       = module.firebase.fcm_sender_keys
  sensitive   = true
}

/**
 * NATS JetStream stream name, when the NATS control plane is configured.
 */
output "nats_event_stream" {
  description = "Figentra event JetStream stream name."
  value       = try(module.nats_jetstream[0].stream_name, null)
}

/**
 * Worker Rate Limiting namespace IDs consumed by Wrangler configuration
 * rendering. Values are environment-specific and therefore never hardcoded
 * in worker source/configuration.
 */
output "worker_rate_limit_namespace_ids" {
  description = "Logical worker name -> stable Cloudflare Worker Rate Limiting namespace ID."
  value       = { for key, module in module.worker_rate_limit : key => module.namespace_id }
}

/**
 * Durable Infrastructure Orchestrator state identifiers.
 */
output "orchestrator_database_id" {
  description = "D1 database id used for orchestrator job state."
  value       = module.orchestrator.database_id
}

output "orchestrator_workflow_id" {
  description = "Cloudflare Workflow id used by infrastructure orchestration."
  value       = module.orchestrator.workflow_id
}
