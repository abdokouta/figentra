/**
 * @file worker-configuration.d.ts
 * @description Wrangler-generated Cloudflare binding declarations.
 *
 * Run `pnpm cf-typegen` after changing wrangler.jsonc. Do not hand-maintain
 * provider-generated binding types in production.
 */

interface CloudflareBindings {
  DB: D1Database;
  TERRAFORM_RUNNER: DurableObjectNamespace;
  INFRA_WORKFLOW: Workflow;
  IDENTITY_JWKS_URL: string;
  IDENTITY_ISSUER: string;
  IDENTITY_AUDIENCE: string;
  APPLY_PERMISSION: string;
  DESTROY_PERMISSION: string;
  DESTROY_PERMISSION: string;
  TERRAFORM_REPOSITORY: string;
  TERRAFORM_GIT_TOKEN: string;
  LOG_LEVEL?: string;
}
