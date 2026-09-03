# NATS JetStream Terraform Module

This module manages the durable JetStream event stream after a NATS cluster is
available.

For production, Figentra should use a managed NATS control plane such as Synadia
Cloud/NGS or an approved self-hosted NATS cluster. Synadia documents
per-account/per-service users with NATS 2.0 credentials and supports HA clusters
and multi-region superclusters. The credentials are injected at Terraform run
time and never committed.

References:

- https://docs.synadia.com/cloud/user-guides/quick-start
- https://registry.terraform.io/providers/nats-io/jetstream/latest/docs
