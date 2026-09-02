/**
 * @file versions.tf
 * @description Provider constraints for NATS JetStream infrastructure.
 */
terraform {
  required_version = ">= 1.9.0, < 2.0.0"

  required_providers {
    jetstream = {
      source  = "nats-io/jetstream"
      version = "~> 0.4"
    }
  }
}
