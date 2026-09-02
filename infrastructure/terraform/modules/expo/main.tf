# =============================================================================
# module: expo — EAS project + EAS Update channels/branches (spec 15)
# =============================================================================
#
# For each mobile deployable (runtime: expo-mobile), provisions:
#   - one `expo_app` (the EAS project; its id feeds `eas init --id`, which writes
#     app.json extra.eas.projectId).
#   - three `expo_update_branch` + `expo_update_channel` (development, preview,
#     production) mapped 1:1 — the channel names MUST match the `channel` fields
#     in the app's eas.json build profiles.
#
# BOUNDARY: Terraform OWNS the EAS project + update channels/branches. EAS builds
# and submits the binaries (eas.json + the .ci/ EAS Workflow); Terraform does NOT
# build. FCM push credentials are provisioned by modules/firebase and attached to
# EAS via `eas credentials` (needs an EAS keystore) — deliberately left to that
# CLI flow rather than the fragile expo_android_app_credentials resource (which
# requires a pre-existing keystore_id).
#
# Auth: the `expo` provider reads EXPO_TOKEN + EXPO_ACCOUNT_NAME (providers.tf);
# no secret is set here. Args verified against elevenode/expo ~> 1.1:
# expo_app{name,slug}; expo_update_branch{app_id,name};
# expo_update_channel{app_id,name,branch_mapping (jsonencode)}.
# =============================================================================

terraform {
  required_providers {
    expo = {
      source = "elevenode/expo"
    }
  }
}

variable "deployables" {
  description = "Slug-keyed map of mobile deployables (locals.mobile)."
  type        = map(any)
}

locals {
  # EAS Update channels — MUST match each app's eas.json build-profile `channel`.
  expo_channels = ["development", "preview", "production"]

  # Flatten apps x channels -> "<slug>:<channel>" for the branch/channel resources.
  app_channels = {
    for pair in setproduct(keys(var.deployables), local.expo_channels) :
    "${pair[0]}:${pair[1]}" => { slug = pair[0], channel = pair[1] }
  }
}

# The EAS project. `id` is the projectId consumers wire via `eas init --id`.
resource "expo_app" "this" {
  for_each = var.deployables
  name     = try(each.value.mobile.display_name, each.value.slug)
  slug     = try(each.value.mobile.eas_slug, each.value.slug)
}

# One update branch per channel, per app.
resource "expo_update_branch" "this" {
  for_each = local.app_channels
  app_id   = expo_app.this[each.value.slug].id
  name     = each.value.channel
}

# One update channel per branch, routed 1:1 (whole channel -> same-named branch).
# Percentage rollouts are a later concern — see docs.expo.dev/eas-update/channel-surfing.
resource "expo_update_channel" "this" {
  for_each = local.app_channels
  app_id   = expo_app.this[each.value.slug].id
  name     = each.value.channel

  branch_mapping = jsonencode({
    version = 0
    data = [{
      branchId           = expo_update_branch.this[each.key].id
      branchMappingLogic = "true"
    }]
  })
}

output "app_ids" {
  description = "slug -> EAS project id. Feed into `eas init --id <id>` (app.json extra.eas.projectId)."
  value       = { for slug, app in expo_app.this : slug => app.id }
}

output "channel_ids" {
  description = "\"<slug>:<channel>\" -> EAS update channel id."
  value       = { for k, ch in expo_update_channel.this : k => ch.id }
}
