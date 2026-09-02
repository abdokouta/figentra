#!/usr/bin/env node
/**
 * @file infrastructure/scripts/collect-cloud-yaml.mjs
 * @description Builds the canonical Figentra deployment catalog.
 *
 * The root cloud.yaml explicitly enrolls local paths. The collector MUST NOT
 * recursively discover apps/services/workers outside those declared paths.
 * Each enrolled directory MUST provide its own cloud.yaml manifest.
 *
 * The generated catalog is consumed by Terraform and Docker generation. It is
 * a build artifact and never a second source of deployment truth.
 *
 * @security No secrets are read, copied, or emitted by this collector.
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const ROOT_MANIFEST = join(REPO_ROOT, "cloud.yaml");
const CATALOG_OUT = join(REPO_ROOT, "infrastructure", "catalog.json");
const EXTERNAL_ROOT = process.env.FIGENTRA_DEV_ROOT ?? join(homedir(), "dev");
const GIT_BASE = process.env.FIGENTRA_GIT_BASE ?? "https://gitlab.com/";

const ALLOWED_RUNTIMES = new Set([
  "cloudflare-worker",
  "cloudflare-container",
  "cloudflare-assets",
  "node-container",
  "expo-mobile",
]);

/**
 * Reads a YAML document.
 *
 * @param {string} path - Absolute document path.
 * @returns {object|null} Parsed document or null when the file is absent.
 */
function readYaml(path) {
  if (!existsSync(path)) return null;
  return parseYaml(readFileSync(path, "utf8"));
}

/**
 * Terminates catalog generation with an actionable validation error.
 *
 * @param {string} message - Failure description.
 * @returns {never}
 */
function fail(message) {
  console.error(`✖ catalog: ${message}`);
  process.exit(1);
}

/**
 * Tests whether a path exists and is a directory.
 *
 * @param {string} path - Candidate path.
 * @returns {boolean} True when the path is a directory.
 */
function isDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

/**
 * Resolves the supported root-level glob syntax used by cloud.yaml.
 *
 * Supported patterns are literal directories and one `*` path segment. This
 * intentionally avoids introducing a hidden filesystem discovery dependency.
 *
 * @param {string} pattern - Repository-relative source pattern.
 * @returns {string[]} Matching repository-relative directories.
 */
function resolveLocalPaths(pattern) {
  const normalized = pattern.replaceAll("\\", "/").replace(/^\.\//, "");
  const segments = normalized.split("/").filter(Boolean);
  const matches = [];

  /**
   * Recursively resolves one path segment at a time.
   *
   * @param {string} currentAbsolute - Current absolute directory.
   * @param {number} index - Segment index.
   * @param {string[]} resolved - Already resolved segments.
   */
  function walk(currentAbsolute, index, resolved) {
    if (index === segments.length) {
      if (isDirectory(currentAbsolute)) matches.push(resolved.join("/"));
      return;
    }

    const segment = segments[index];
    if (segment === "*") {
      if (!isDirectory(currentAbsolute)) return;
      for (const entry of readdirSync(currentAbsolute).sort()) {
        const next = join(currentAbsolute, entry);
        if (isDirectory(next)) walk(next, index + 1, [...resolved, entry]);
      }
      return;
    }

    walk(join(currentAbsolute, segment), index + 1, [...resolved, segment]);
  }

  walk(REPO_ROOT, 0, []);
  return matches;
}

/**
 * Validates and normalizes one deployable manifest.
 *
 * @param {object} manifest - Parsed cloud.yaml document.
 * @param {object} source - Source metadata.
 * @returns {object} Normalized catalog entry.
 */
function normalizeDeployable(manifest, source) {
  if (!manifest || typeof manifest !== "object") {
    fail(`invalid manifest at ${source.source_path}`);
  }
  if (!manifest.slug) fail(`manifest missing slug at ${source.source_path}`);
  if (!manifest.brand) fail(`manifest ${manifest.slug} missing brand`);
  if (!manifest.kind) fail(`manifest ${manifest.slug} missing kind`);
  if (!manifest.runtime) fail(`manifest ${manifest.slug} missing runtime`);
  if (!ALLOWED_RUNTIMES.has(manifest.runtime)) {
    fail(`manifest ${manifest.slug} has unsupported runtime ${manifest.runtime}`);
  }
  if (!manifest.source?.path) fail(`manifest ${manifest.slug} missing source.path`);
  if (manifest.docker?.enabled) {
    if (!manifest.container?.port) fail(`manifest ${manifest.slug} missing container.port`);
    if (!manifest.container?.health_path) fail(`manifest ${manifest.slug} missing container.health_path`);
    if (manifest.docker.container_port !== manifest.container?.port) fail(`manifest ${manifest.slug} docker.container_port must equal container.port`);
    if (manifest.docker.health_path !== manifest.container?.health_path) fail(`manifest ${manifest.slug} docker.health_path must equal container.health_path`);
  }

  return {
    ...manifest,
    source_kind: source.source_kind,
    repo_slug: source.repo_slug ?? null,
    source_path: source.source_path,
  };
}

/**
 * Loads all explicitly enrolled local sources.
 *
 * @param {string[]} paths - Root manifest path patterns.
 * @param {Set<string>} slugs - Mutable deployable slug registry.
 * @param {object[]} target - Mutable normalized deployable list.
 */
function collectLocal(paths, slugs, target) {
  if (!Array.isArray(paths) || paths.length === 0) {
    fail("root cloud.yaml must declare at least one `paths:` source");
  }

  const includePatterns = paths.filter((pattern) => typeof pattern === "string" && !pattern.startsWith("!"));
  const excludePatterns = paths.filter((pattern) => typeof pattern === "string" && pattern.startsWith("!"))
    .map((pattern) => pattern.slice(1));

  if (includePatterns.length === 0) fail("root cloud.yaml paths must contain at least one include pattern");

  const excluded = new Set(excludePatterns.flatMap(resolveLocalPaths));
  const selected = new Set();

  for (const rawPattern of includePatterns) {
    if (!rawPattern) fail("every paths[] entry must be a non-empty string");
    const matches = resolveLocalPaths(rawPattern);
    if (matches.length === 0) fail(`paths entry matches no directory: ${rawPattern}`);
    for (const directory of matches) selected.add(directory);
  }

  for (const directory of [...selected].sort()) {
    if (excluded.has(directory)) continue;
    const manifestPath = join(REPO_ROOT, directory, "cloud.yaml");
    if (!existsSync(manifestPath)) fail(`enrolled source has no cloud.yaml: ${directory}`);
    const manifest = normalizeDeployable(readYaml(manifestPath), {
      source_kind: "local",
      repo_slug: null,
      source_path: relative(REPO_ROOT, manifestPath),
    });
    if (slugs.has(manifest.slug)) fail(`duplicate deployable slug: ${manifest.slug}`);
    slugs.add(manifest.slug);
    target.push(manifest);
  }
}

/**
 * Collects explicitly declared external repository sources.
 *
 * @param {object[]} repos - Root cloud.yaml repos.
 * @param {Set<string>} slugs - Mutable deployable slug registry.
 * @param {object[]} target - Mutable normalized deployable list.
 */
function collectExternal(repos, slugs, target) {
  if (!Array.isArray(repos)) fail("root cloud.yaml `repos:` must be an array");

  for (const repo of repos) {
    if (!repo?.slug || !repo?.repo) fail(`invalid repos[] entry: ${JSON.stringify(repo)}`);
    const checkout = join(EXTERNAL_ROOT, repo.repo);
    if (!isDirectory(checkout)) {
      const url = `${GIT_BASE}${repo.repo}.git`;
      mkdirSync(dirname(checkout), { recursive: true });
      execFileSync("git", ["clone", "--depth", "1", ...(repo.ref ? ["--branch", repo.ref] : []), url, checkout], {
        stdio: "inherit",
      });
    }

    const candidates = [];
    const rootManifest = join(checkout, "cloud.yaml");
    if (existsSync(rootManifest)) candidates.push(rootManifest);
    const appsDir = join(checkout, "apps");
    if (isDirectory(appsDir)) {
      for (const entry of readdirSync(appsDir).sort()) {
        const path = join(appsDir, entry, "cloud.yaml");
        if (existsSync(path)) candidates.push(path);
      }
    }

    if (candidates.length === 0) fail(`external repository ${repo.repo} contains no cloud.yaml`);
    for (const manifestPath of candidates) {
      const manifest = normalizeDeployable(readYaml(manifestPath), {
        source_kind: "external",
        repo_slug: repo.slug,
        source_path: relative(EXTERNAL_ROOT, manifestPath),
      });
      if (slugs.has(manifest.slug)) fail(`duplicate deployable slug: ${manifest.slug}`);
      slugs.add(manifest.slug);
      target.push(manifest);
    }
  }
}

const root = readYaml(ROOT_MANIFEST);
if (!root) fail(`missing root manifest: ${ROOT_MANIFEST}`);
if (root.version !== 1) fail(`unsupported cloud.yaml version: ${root.version}`);

const products = Array.isArray(root.products) ? root.products : [];
if (products.length === 0) fail("root cloud.yaml declares no products");
const productSlugs = new Set(products.map((product) => product.slug));

const deployables = [];
const seenSlugs = new Set();
collectLocal(root.paths, seenSlugs, deployables);
collectExternal(root.repos ?? [], seenSlugs, deployables);

for (const deployable of deployables) {
  if (!productSlugs.has(deployable.brand)) {
    fail(`deployable ${deployable.slug} references unknown brand ${deployable.brand}`);
  }
}

mkdirSync(dirname(CATALOG_OUT), { recursive: true });
writeFileSync(
  CATALOG_OUT,
  `${JSON.stringify({ generated_at: new Date().toISOString(), products, deployables }, null, 2)}\n`,
  "utf8",
);

console.log(`✔ catalog: ${deployables.length} explicitly enrolled deployables -> ${relative(REPO_ROOT, CATALOG_OUT)}`);
