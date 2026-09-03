#!/usr/bin/env node
/**
 * @file infrastructure/terraform/scripts/render-wrangler-bindings.mjs
 * @description Figentra source file.
 *
 * This file is governed by the repository code/documentation standard. Public
 * symbols and non-obvious architectural decisions require TSDoc/comments.
 */
/**
 * @file render-wrangler-bindings.mjs
 * @description Renders Terraform-produced resource IDs into Worker Wrangler
 * configuration files without copying secrets into source control.
 *
 * Usage:
 *   node infrastructure/terraform/scripts/render-wrangler-bindings.mjs \
 *     --worker registry --env development
 *
 * The command reads `terraform output -json` from the configured environment
 * root and replaces only the explicit GENERATED_BY_TERRAFORM placeholders.
 * Secrets are never read from Terraform outputs by this renderer.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..", "..");
const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const token = process.argv[index];
  if (!token.startsWith("--")) continue;
  args.set(token.slice(2), process.argv[index + 1]);
  index += 1;
}

const worker = args.get("worker");
const rawEnv = args.get("env") ?? "development";
const env = rawEnv;
if (!worker) throw new Error("--worker registry|infrastructure-orchestrator is required");
if (!new Set(["development", "staging", "production"]).has(env))
  throw new Error("--env must be development|staging|production");

const target = {
  registry: "workers/registry/wrangler.jsonc",
  "infrastructure-orchestrator": "workers/infrastructure-orchestrator/wrangler.jsonc",
}[worker];
if (!target) throw new Error(`Unsupported Worker: ${worker}`);
const terraformOutput = execFileSync(
  "terraform",
  ["-chdir=infrastructure/terraform", "output", "-json"],
  { cwd: root, encoding: "utf8" },
);
const values = JSON.parse(terraformOutput);

/**
 * Extracts a Terraform output value while failing closed when it is absent.
 * @param {string} name Output name.
 * @returns {any} Output value.
 */
function output(name) {
  if (!(name in values)) throw new Error(`Terraform output ${name} is missing`);
  return values[name].value;
}

const projectRef = output("supabase_project_ref");
if (typeof projectRef !== "string" || projectRef.length === 0) {
  throw new Error("Supabase project ref is missing; Identity JWKS cannot be rendered");
}
const identityBase = `https://${projectRef}.supabase.co/auth/v1`;
const envHost = env === "production" ? "" : env === "staging" ? ".staging" : ".dev";
const iamUrl = `https://iam${envHost}.figentra.com/v1/authorize`;
const exchangeUrl = `https://identity${envHost}.figentra.com/v1/oauth/token/exchange`;

let text = readFileSync(resolve(root, target), "utf8");

if (worker === "registry") {
  const d1 = output("d1_database_ids")["application-registry"];
  const kv = output("kv_namespace_ids")["application-registry"];
  if (!d1 || !kv) throw new Error("Registry Terraform outputs are incomplete");
  text = text.replace(
    /"database_id": "GENERATED_BY_TERRAFORM"/,
    `"database_id": ${JSON.stringify(d1)}`,
  );
  text = text.replace(/"id": "GENERATED_BY_TERRAFORM"/, `"id": ${JSON.stringify(kv)}`);
  text = text.replaceAll(
    '"database_id": "GENERATED_BY_TERRAFORM"',
    `"database_id": ${JSON.stringify(d1)}`,
  );
  text = text.replaceAll('"id": "GENERATED_BY_TERRAFORM"', `"id": ${JSON.stringify(kv)}`);
  text = text.replaceAll(
    '"IDENTITY_JWKS_URL": "GENERATED_BY_TERRAFORM"',
    `"IDENTITY_JWKS_URL": ${JSON.stringify(identityBase + "/.well-known/jwks.json")}`,
  );
  text = text.replaceAll(
    '"IDENTITY_ISSUER": "GENERATED_BY_TERRAFORM"',
    `"IDENTITY_ISSUER": ${JSON.stringify(identityBase)}`,
  );
} else {
  const databaseId = output("orchestrator_database_id");
  if (!databaseId) throw new Error("Infrastructure Orchestrator Terraform outputs are incomplete");
  text = text.replaceAll(
    '"database_id": "GENERATED_BY_TERRAFORM"',
    `"database_id": ${JSON.stringify(databaseId)}`,
  );
  text = text.replaceAll(
    '"IDENTITY_JWKS_URL": "GENERATED_BY_TERRAFORM"',
    `"IDENTITY_JWKS_URL": ${JSON.stringify(identityBase + "/.well-known/jwks.json")}`,
  );
  text = text.replaceAll(
    '"IDENTITY_ISSUER": "GENERATED_BY_TERRAFORM"',
    `"IDENTITY_ISSUER": ${JSON.stringify(identityBase)}`,
  );
}

const destination = resolve(root, target.replace("wrangler.jsonc", `wrangler.${env}.jsonc`));
writeFileSync(destination, text, "utf8");
console.log(`Rendered ${destination}`);
