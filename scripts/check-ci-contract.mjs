#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import YAML from "yaml";

const root = resolve(import.meta.dirname, "..");
const ciPath = resolve(root, ".gitlab-ci.yml");
const catalog = JSON.parse(readFileSync(resolve(root, "infrastructure/catalog.json"), "utf8"));
const ciText = readFileSync(ciPath, "utf8");
const failures = [];
const docker = new Set((catalog.deployables ?? []).filter(d => d.docker?.enabled).map(d => d.slug));
const workers = new Set((catalog.deployables ?? []).filter(d => d.kind === "worker").map(d => d.slug));
if (ciText.includes("npm install --frozen-lockfile")) failures.push("CI uses npm frozen-lockfile instead of pnpm");
if (!ciText.includes("pnpm install --frozen-lockfile")) failures.push("CI must use pnpm install --frozen-lockfile");
for (const name of ["integration", "workflows", "webhook", "api-gateway", "ai-gateway"]) {
  if (ciText.match(new RegExp(`\\b${name}\\b`))) failures.push(`stale CI deployable name: ${name}`);
}
for (const name of docker) {
  if (!ciText.includes(name)) failures.push(`Docker-enabled catalog service missing from CI: ${name}`);
}
for (const name of workers) {
  if (!ciText.includes(name)) failures.push(`Catalog worker missing from CI: ${name}`);
}
for (const env of ["development", "staging", "production"]) {
  if (!ciText.includes(`TF_WORKSPACE: ${env}`)) failures.push(`CI missing canonical Terraform workspace: ${env}`);
}
if (failures.length) { console.error(failures.map(x => `- ${x}`).join("\n")); process.exit(1); }
console.log("CI contract passed.");
