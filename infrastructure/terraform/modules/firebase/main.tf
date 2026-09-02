# =============================================================================
# module: firebase — GCP project + Firebase + FCM per mobile deployable (spec 15)
# =============================================================================
#
# Approach A (destroy-clean): Terraform CREATES and OWNS the GCP project, so
# `terraform destroy` removes the WHOLE project (deletion_policy = "DELETE").
# Referencing a pre-existing project could not be torn down this way.
#
# Per deployable whose cloud.yaml sets capabilities.needs_firebase:
#   - google_project (deletion_policy DELETE) under the figentra GCP org+billing.
#   - google_project_service: enable firebase / cloudresourcemanager /
#     serviceusage / fcm APIs.
#   - google_firebase_project (google-beta): turn the project into a Firebase project.
#   - google_firebase_android_app / google_firebase_apple_app: register the native
#     apps (package_name / bundle_id come from cloud.yaml mobile.bundle_id).
#   - google_service_account + key: the FCM v1 sender credential (push send).
#
# The FCM key is exported (sensitive) for upload to EAS / the backend push sender;
# wiring it into EAS credentials is an `eas credentials` step (needs a keystore),
# not modeled in Terraform.
#
# Auth: the google/google-beta providers read GOOGLE_CREDENTIALS (a project-
# creator + billing.user service-account JSON) or fall back to Application
# Default Credentials (providers.tf). Args verified against hashicorp/google +
# google-beta ~> 8.0.
# =============================================================================

terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
    }
    google-beta = {
      source = "hashicorp/google-beta"
    }
    random = {
      source = "hashicorp/random"
    }
  }
}

variable "deployables" {
  description = "Slug-keyed map of deployables needing Firebase (locals.needs_firebase)."
  type        = map(any)
}

variable "env" {
  description = "Environment (development | staging | production) — suffixes the project id/name."
  type        = string
}

variable "gcp_org_id" {
  description = "GCP organization id that owns the created projects. Empty = no org (standalone)."
  type        = string
  default     = ""
}

variable "gcp_billing_account" {
  description = "GCP billing account id linked to each created project. Empty = unlinked."
  type        = string
  default     = ""
}

locals {
  env_short = { dev = "dev", staging = "stg", production = "prd" }

  # APIs every Firebase/FCM project needs enabled.
  firebase_apis = [
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "firebase.googleapis.com",
    "fcm.googleapis.com",
  ]

  # Flatten deployables x apis -> "<slug>:<api>".
  project_apis = {
    for pair in setproduct(keys(var.deployables), local.firebase_apis) :
    "${pair[0]}:${pair[1]}" => { slug = pair[0], api = pair[1] }
  }

  # Only deployables that declare a bundle id get native app registrations.
  with_bundle = { for k, d in var.deployables : k => d if try(d.mobile.bundle_id, "") != "" }
}

# Random suffix keeps the globally-unique project_id collision-free and lets
# destroy+recreate obtain a fresh id.
resource "random_id" "suffix" {
  for_each    = var.deployables
  byte_length = 2 # 4 hex chars
}

resource "google_project" "this" {
  for_each = var.deployables
  name     = "${each.value.brand} ${each.key} ${var.env}"
  # project_id: lowercase, <=30 chars, no trailing hyphen -> "fg-<slug>-<env>-<hex>".
  project_id      = substr("fg-${each.key}-${local.env_short[var.env]}-${random_id.suffix[each.key].hex}", 0, 30)
  org_id          = var.gcp_org_id != "" ? var.gcp_org_id : null
  billing_account = var.gcp_billing_account != "" ? var.gcp_billing_account : null
  deletion_policy = "DELETE" # Approach A: destroy nukes the whole project.
  labels = {
    brand = each.value.brand
    env   = var.env
    slug  = each.key
  }
}

resource "google_project_service" "this" {
  for_each                   = local.project_apis
  project                    = google_project.this[each.value.slug].project_id
  service                    = each.value.api
  disable_dependent_services = true
  disable_on_destroy         = false # avoid destroy-time API-disable ordering faults
}

resource "google_firebase_project" "this" {
  provider   = google-beta
  for_each   = var.deployables
  project    = google_project.this[each.key].project_id
  depends_on = [google_project_service.this]
}

resource "google_firebase_android_app" "this" {
  provider     = google-beta
  for_each     = local.with_bundle
  project      = google_project.this[each.key].project_id
  display_name = "${try(each.value.mobile.display_name, each.key)} (Android)"
  package_name = each.value.mobile.bundle_id
  depends_on   = [google_firebase_project.this]
}

resource "google_firebase_apple_app" "this" {
  provider     = google-beta
  for_each     = local.with_bundle
  project      = google_project.this[each.key].project_id
  display_name = "${try(each.value.mobile.display_name, each.key)} (iOS)"
  bundle_id    = each.value.mobile.bundle_id
  depends_on   = [google_firebase_project.this]
}

# FCM v1 sender service account (push-send credential -> EAS / backend sender).
resource "google_service_account" "fcm" {
  for_each     = var.deployables
  project      = google_project.this[each.key].project_id
  account_id   = "fcm-sender"
  display_name = "FCM v1 sender (${each.key})"
  depends_on   = [google_project_service.this]
}

resource "google_service_account_key" "fcm" {
  for_each           = var.deployables
  service_account_id = google_service_account.fcm[each.key].name
}

output "project_ids" {
  description = "slug -> GCP/Firebase project id."
  value       = { for k, p in google_project.this : k => p.project_id }
}

output "android_app_ids" {
  description = "slug -> Firebase Android app id."
  value       = { for k, a in google_firebase_android_app.this : k => a.app_id }
}

output "apple_app_ids" {
  description = "slug -> Firebase Apple app id."
  value       = { for k, a in google_firebase_apple_app.this : k => a.app_id }
}

output "fcm_sender_emails" {
  description = "slug -> FCM v1 sender service-account email."
  value       = { for k, sa in google_service_account.fcm : k => sa.email }
}

output "fcm_sender_keys" {
  description = "slug -> base64 FCM v1 sender service-account key JSON (upload to EAS/backend for push send)."
  value       = { for k, key in google_service_account_key.fcm : k => key.private_key }
  sensitive   = true
}
