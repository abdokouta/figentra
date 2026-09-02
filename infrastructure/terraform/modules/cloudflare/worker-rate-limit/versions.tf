/**
 * @file versions.tf
 * @description Provider constraints for the Cloudflare Worker rate-limit binding namespace.
 */
terraform {
  required_version = ">= 1.9.0, < 2.0.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}
