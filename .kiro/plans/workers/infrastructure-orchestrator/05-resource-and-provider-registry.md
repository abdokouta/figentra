# Infrastructure Orchestrator — Provider and Resource Registry

The orchestrator uses an explicit allowlist registry. It is not a generic cloud API proxy.

## Provider metadata

Provider ID, supported environments, regions, authentication mechanism, adapter version, API endpoint identity, supported resource types, actions, rate limits, timeout and capability flags.

## Resource/action model

Each resource type declares allowed actions (`read`, `plan`, `apply`, `replace`, `destroy` where permitted), required IAM permission, environment restrictions, destructive classification, timeout, retry safety and reconciliation method.

## Providers

Terraform is the declarative execution adapter. Cloudflare and other cloud/container providers are adapters only where an explicit control-plane operation cannot be represented as the approved IaC workflow. Provider-specific schemas never leak through the public contract.

## Registration

Provider/resource definitions are code-reviewed, versioned and deployed with the orchestrator. No user can register an arbitrary provider endpoint or action. Unsupported provider/resource/action returns `TARGET_NOT_ALLOWED`.