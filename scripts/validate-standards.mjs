#!/usr/bin/env node
/**
 * @file validate-standards.mjs
 * @description Lightweight repository-wide standards validator.
 *
 * The validator intentionally checks structural invariants that can be
 * evaluated without installing or executing every workspace.
 */

import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures = [];

function walk(dir) {
  if (!existsSync(dir)) return [];
  const result = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result;
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`Missing: ${path}`);
}

function checkNoEslintInDeployables(base) {
  for (const file of walk(join(root, base))) {
    if (!file.endsWith("package.json")) continue;
    const pkg = JSON.parse(readFileSync(file, "utf8"));
    const allScripts = Object.values(pkg.scripts ?? {}).join(" ");
    if (allScripts.includes("eslint") || allScripts.includes("expo lint")) {
      failures.push(`ESLint lint script found: ${relative(root, file)}`);
    }
  }
}

requireFile("pnpm-workspace.yaml");
requireFile("packages/config/oxlint-config/src/native.jsonc");
requireFile("pnpm-lock.yaml");
requireFile(".ref/TASKLIST.md");
requireFile(".docs/standards/README.md");
requireFile(".docs/standards/17-pnpm-lockfile-standard.md");
requireFile(".docs/standards/environment-naming-standard.md");
requireFile(".docs/standards/package-standard.md");
requireFile(".docs/standards/testing-standard.md");
requireFile(".docs/standards/nest-service-standard.md");
requireFile(".docs/standards/worker-standard.md");
requireFile(".docs/standards/vite-app-standard.md");
requireFile(".docs/standards/yaml-manifest-standard.md");

for (const base of ["services", "workers", "apps", "packages"]) {
  if (existsSync(join(root, base))) checkNoEslintInDeployables(base);
}

if (existsSync(join(root, "packages", "eslint-config"))) failures.push("@stackra/eslint-config must be removed; oxlint is the sole lint engine");
for (const file of walk(root)) {
  if (!file.endsWith("package.json")) continue;
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  const allDeps = Object.assign({}, pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.optionalDependencies);
  if (allDeps.eslint || allDeps["eslint-config-expo"] || allDeps["@stackra/eslint-config"]) failures.push(`ESLint dependency found: ${relative(root, file)}`);
}

if (failures.length) {
  console.error("Standards validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Repository standards validation passed.");
