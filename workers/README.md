# Figentra Workers

## Worker boundaries

- `gateway` is the authenticated edge API gateway.
- `registry` is the application/control-plane registry backed by D1.
- `infrastructure-orchestrator` is the infrastructure control plane. It accepts
  authenticated Terraform intents and dispatches them to an isolated Container.

## Terraform execution decision

A Worker is a good HTTP/control-plane boundary for Terraform, but it is not the
Terraform execution environment. Cloudflare Containers provide the Linux
filesystem and process runtime required by Terraform. The orchestrator Worker
therefore validates and records intent, then starts a dedicated Terraform
Container. This keeps arbitrary command execution out of the Worker runtime and
allows Terraform to run with explicit credentials, state backends, and approval
policy.

See the current Cloudflare Containers documentation:
https://developers.cloudflare.com/containers/
