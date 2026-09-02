/**
 * @file versions.tf
 * @description Terraform and provider constraints for `expo`.
 *
 * Provider source/version is declared here; credentials are configured only
 * by the root environment.
 */

terraform {
  required_version = ">= 1.9.0, < 2.0.0"
}
