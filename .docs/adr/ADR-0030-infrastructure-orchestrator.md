# ADR-0030 — Infrastructure Orchestrator

## Status
Accepted.

## Decision
The Infrastructure Orchestrator is a Cloudflare Worker control-plane API. It
does not execute Terraform directly in the Worker runtime.

Durable orchestration is performed through Cloudflare Workflows. Terraform
execution occurs inside a restricted Cloudflare Container runner with a fixed
Terraform entrypoint, exact source revision, controlled operation, network
egress policy, scoped credentials, audit records and concurrency controls.

Terraform remains the infrastructure source of truth.

## Consequences
HTTP control-plane concerns and privileged Terraform execution remain separate.
