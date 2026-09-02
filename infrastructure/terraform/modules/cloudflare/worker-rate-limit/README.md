# Worker Rate Limiting Namespace

Cloudflare Worker Rate Limiting uses an integer namespace ID in the Worker
binding. The module generates a stable account-local ID when one is not supplied
and exposes it as a Terraform output for Wrangler rendering.

The Gateway still performs principal/tenant/resource-aware limits in code. This
binding is the Cloudflare-native enforcement layer and should be treated as
infrastructure configuration, not application authorization.
