/**
 * @file main.tf
 * @description JetStream stream provisioning for the Figentra event backbone.
 *
 * This module does not create the NATS server cluster. The server/control plane
 * is a separate infrastructure concern; the module assumes a reachable,
 * authenticated NATS 2.0 endpoint.
 */


resource "jetstream_stream" "figentra_events" {
  count    = var.enabled ? 1 : 0
  name     = var.stream_name
  subjects = var.subjects
  storage  = "file"
  max_age  = var.max_age_seconds
}

output "stream_name" {
  description = "Provisioned Figentra JetStream stream."
  value       = var.enabled ? jetstream_stream.figentra_events[0].name : null
}
