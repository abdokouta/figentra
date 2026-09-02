#!/usr/bin/env node
/**
 * @file scripts/check-infrastructure-contract.mjs
 * @description Static enterprise gate for Figentra deployment-source, Docker,
 * and Terraform repository contracts.
 *
 * This gate does not contact providers or apply infrastructure. It catches
 * configuration drift before Terraform/Docker execution.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import YAML from "yaml";

const root = resolve(import.meta.dirname, "..");
const failures = [];
const canonicalEnvironments = ["development", "staging", "production"];

/** Records a contract violation. */
function fail(message) {
  failures.push(message);
}

/** Reads a YAML document from repository-relative path. */
function yaml(path) {
  return YAML.parse(readFileSync(join(root, path), "utf8"));
}

const cloud = yaml("cloud.yaml");
if (cloud.version !== 1) fail("cloud.yaml version must be 1");
if (!Array.isArray(cloud.paths) || cloud.paths.length === 0) fail("cloud.yaml paths must be a non-empty flat list");
if (cloud.paths.some((value) => typeof value !== "string")) fail("cloud.yaml paths must contain strings only");
if (cloud.paths.some((value) => value.includes("packages/"))) fail("deployment paths must not enroll shared packages");

const selected = new Set();
for (const pattern of cloud.paths.filter((value) => !value.startsWith("!"))) {
  const base = pattern.endsWith("/*") ? pattern.slice(0, -2) : pattern;
  const dir = join(root, base);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) fail(`cloud.yaml path base missing: ${pattern}`);
  for (const entry of readdirSync(dir)) {
    const candidate = join(dir, entry);
    if (statSync(candidate).isDirectory()) selected.add(candidate);
  }
}

for (const directory of selected) {
  const manifestPath = join(directory, "cloud.yaml");
  if (!existsSync(manifestPath)) fail(`enrolled deployment source missing cloud.yaml: ${directory.replace(`${root}/`, "")}`);
  else {
    const manifest = YAML.parse(readFileSync(manifestPath, "utf8"));
    if (!manifest.slug) fail(`${manifestPath} missing slug`);
    if (!manifest.runtime) fail(`${manifestPath} missing runtime`);
    if (!manifest.brand) fail(`${manifestPath} missing brand`);
    if (manifest.runtime === "cloudflare-container" && manifest.kind === "service" && !manifest.docker?.enabled) {
      fail(`${manifestPath} container service must declare docker.enabled=true`);
    }
    for (const environment of canonicalEnvironments) {
      if (manifest.env_vars && !(environment in manifest.env_vars)) fail(`${manifestPath} missing env_vars.${environment}`);
    }
  }
}

for (const environment of canonicalEnvironments) {
  const path = `infrastructure/environments/${environment}.yaml`;
  if (!existsSync(join(root, path))) fail(`missing canonical environment manifest: ${path}`);
  else {
    const manifest = yaml(path);
    if (manifest.environment !== environment) fail(`${path} environment mismatch`);
    if (!manifest.external?.doppler_config) fail(`${path} missing external.doppler_config`);
    if (!manifest.external?.wrangler_environment) fail(`${path} missing external.wrangler_environment`);
    if (manifest.external?.terraform_workspace !== environment) fail(`${path} terraform_workspace must equal ${environment}`);
    if (environment === "production" && manifest.external?.docker_compose !== false) fail(`${path} production docker_compose must be false`);
  }
}

// Docker contracts: every enabled service has an explicit, internally-consistent
// container port and health path.
const dockerDeployables = [];
const catalog = JSON.parse(readFileSync(join(root, "infrastructure/catalog.json"), "utf8"));
for (const deployable of catalog.deployables ?? []) {
  if (deployable.docker?.enabled) {
    dockerDeployables.push(deployable.slug);
    if (!deployable.container?.port) fail(`Docker service ${deployable.slug} missing container.port`);
    if (!deployable.container?.health_path) fail(`Docker service ${deployable.slug} missing container.health_path`);
    if (deployable.docker.container_port !== deployable.container?.port) fail(`Docker service ${deployable.slug} port drift between container.port and docker.container_port`);
    if (deployable.docker.health_path !== deployable.container?.health_path) fail(`Docker service ${deployable.slug} health-path drift`);
    const dockerfile = deployable.docker.dockerfile;
    if (!dockerfile || !existsSync(join(root, dockerfile))) fail(`Docker service ${deployable.slug} Dockerfile missing: ${dockerfile}`);
    else {
      const dockerText = readFileSync(join(root, dockerfile), "utf8");
      if (!dockerText.includes("pnpm install --frozen-lockfile")) fail(`Dockerfile ${dockerfile} must use pnpm install --frozen-lockfile`);
      if (!dockerText.includes("pnpm-workspace.yaml")) fail(`Dockerfile ${dockerfile} must copy pnpm-workspace.yaml`);
      if (!dockerText.includes("pnpm-lock.yaml")) fail(`Dockerfile ${dockerfile} must copy pnpm-lock.yaml`);
      if (!dockerText.includes(deployable.container.health_path)) fail(`Dockerfile ${dockerfile} must use health path ${deployable.container.health_path}`);
    }
  }
}

const terraform = "infrastructure/terraform";
for (const required of ["versions.tf", "providers.tf", "variables.tf", "locals.tf", "deploy.tf", "outputs.tf", "terraform.mk"]) {
  if (!existsSync(join(root, terraform, required))) fail(`missing Terraform root file: ${required}`);
}
const modules = join(root, terraform, "modules");
function validateTerraformModules(base) {
  if (!existsSync(base)) return;
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(base, entry.name);
    if (existsSync(join(dir, "main.tf"))) {
      for (const required of ["main.tf", "variables.tf", "versions.tf"]) {
        if (!existsSync(join(dir, required))) fail(`Terraform module ${dir.replace(`${root}/`, "")} missing ${required}`);
      }
    }
    validateTerraformModules(dir);
  }
}
validateTerraformModules(modules);

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (packageJson.packageManager !== "pnpm@11.24.0") fail(`packageManager must be pnpm@11.24.0`);
if (!existsSync(join(root, "pnpm-workspace.yaml"))) fail("pnpm-workspace.yaml is required");
if (!existsSync(join(root, "pnpm-lock.yaml"))) fail("pnpm-lock.yaml is required for deterministic CI installs");

const ciPath = join(root, ".gitlab-ci.yml");
if (!existsSync(ciPath)) fail(".gitlab-ci.yml is required");
else {
  const ci = YAML.parse(readFileSync(ciPath, "utf8"));
  const ciText = readFileSync(ciPath, "utf8");
  if (ciText.includes("npm install --frozen-lockfile")) fail("CI must use pnpm install --frozen-lockfile");
  if (ciText.includes("pnpm-lock.yaml") === false) fail("CI must cache/require pnpm-lock.yaml");
  for (const stale of ["integration", "workflows", "webhook", "api-gateway", "ai-gateway"]) {
    if (new RegExp(`\\b${stale}\\b`).test(ciText)) fail(`CI references stale deployable name: ${stale}`);
  }
}

const forbidden = /TODO|TBD|PLACEHOLDER|GENERATED_BY_TERRAFORM/;
for (const base of [join(root, terraform), join(root, "infrastructure/docker")]) {
  const stack = [base];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current)) {
      if ([".terraform", ".plans", "node_modules"].includes(entry)) continue;
      const path = join(current, entry);
      const stat = statSync(path);
      if (stat.isDirectory()) stack.push(path);
      else if (/\.(tf|mk|yaml|yml|mjs|sh|md)$/.test(entry) && forbidden.test(readFileSync(path, "utf8"))) {
        // GENERATED_BY_TERRAFORM is a legitimate Wrangler input marker and is
        // resolved by the renderer; do not classify it as a Terraform gap.
        if (!readFileSync(path, "utf8").includes("GENERATED_BY_TERRAFORM")) fail(`forbidden placeholder in ${path.replace(`${root}/`, "")}`);
      }
    }
  }
}

if (failures.length) {
  console.error("Infrastructure contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Infrastructure contract passed.");
