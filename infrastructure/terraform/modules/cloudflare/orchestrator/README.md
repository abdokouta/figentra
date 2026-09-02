# Cloudflare Infrastructure Orchestrator module

Terraform owns the durable Cloudflare D1 and Workflow resources. The Worker
runtime and Container image are deployed through the Worker/Container release
pipeline; they are not treated as mutable shell execution resources.

Cloudflare currently supports `cloudflare_workflow` in Terraform, including
Workflow resources attached to a Worker script. See the current Cloudflare
Terraform documentation before changing provider versions.
