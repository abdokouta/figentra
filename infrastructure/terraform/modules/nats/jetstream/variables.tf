/**
 * @file variables.tf
 * @description Managed NATS JetStream connection and stream configuration.
 *
 * The NATS cluster itself is expected to be provisioned by Synadia Cloud/NGS
 * or an approved managed/self-hosted NATS platform. This module manages the
 * JetStream assets after the cluster exists.
 */

/** Enables JetStream provisioning when the NATS control plane is configured. */
variable "enabled" {
  description = "Whether JetStream assets should be provisioned."
  type        = bool
  default     = false
}

/** NATS server URL. */
variable "servers" {
  description = "NATS server endpoint used by the JetStream provider."
  type        = string
}

/** NATS 2.0 credentials material, injected through Terraform secret handling. */
variable "credentials" {
  description = "NATS 2.0 credentials material for Terraform JetStream management."
  type        = string
  sensitive   = true
}

/** Root CA PEM used for TLS verification when required. */
variable "ca_file_data" {
  description = "Optional PEM CA certificate used to verify the NATS TLS endpoint."
  type        = string
  sensitive   = true
  default     = null
}

/** Stream name for Figentra platform events. */
variable "stream_name" {
  description = "JetStream stream name containing Figentra platform events."
  type        = string
  default     = "FIGENTRA_EVENTS"
}

/** Subject set retained by the platform event stream. */
variable "subjects" {
  description = "NATS subjects retained by the platform event stream."
  type        = list(string)
  default     = ["figentra.events.>"]
}

/** Maximum event retention in seconds. */
variable "max_age_seconds" {
  description = "Maximum event retention period."
  type        = number
  default     = 2_592_000
}
