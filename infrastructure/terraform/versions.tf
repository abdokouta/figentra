# =============================================================================
# Terraform + provider version pins (spec 15 §5)
# =============================================================================
#
# Rule (spec 15 §5): pin provider versions and verify each resource against the
# PINNED version — do not assume every new Cloudflare product has a Terraform
# resource yet. The Cloudflare v5 provider is a large rewrite vs v4 (many
# resource renames + state upgraders); resources are verified against ~> 5.20.
# =============================================================================

terraform {
  required_version = ">= 1.9.0, < 2.0.0"

  required_providers {
    # Primary infrastructure. v5.11+ adds Workers-with-assets + Workflows;
    # v5 covers D1 / Workers KV / R2 / Queues / DNS / zones / routes.
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }

    # Database / project configuration (spec 14 + 15 §5).
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }

    # Observability — monitors, heartbeats, status pages, on-call (spec 15 §4 / 16).
    betteruptime = {
      source  = "BetterStackHQ/better-uptime"
      version = "~> 0.20"
    }

    # Mobile — EAS (Expo Application Services) project + update channels.
    expo = {
      source  = "elevenode/expo"
      version = "~> 1.1"
    }

    # Firebase/FCM via GCP (Approach A: Terraform owns the GCP project). The
    # google-beta provider carries the google_firebase_* resources.
    google = {
      source  = "hashicorp/google"
      version = "~> 8.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 8.0"
    }


    # NATS JetStream provider — manages durable event streams after the NATS
    # control plane/cluster has been provisioned and credentials are injected.
    jetstream = {
      source  = "nats-io/jetstream"
      version = "~> 0.4"
    }

    # Random suffix for globally-unique GCP project ids.
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# -----------------------------------------------------------------------------
# Identity note
# -----------------------------------------------------------------------------
# Supabase Auth is the V1 identity provider. The application/runtime obtains
# public signing keys from the Supabase JWKS endpoint; Terraform does not need
# a separate Supabase Auth provider.
# -----------------------------------------------------------------------------
