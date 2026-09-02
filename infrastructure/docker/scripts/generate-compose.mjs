#!/usr/bin/env node
/**
 * @file infrastructure/docker/scripts/generate-compose.mjs
 * @description Generates the local Docker Compose topology from the canonical
 * deployment catalog and Docker infrastructure manifest.
 *
 * @remarks
 * The root cloud.yaml controls deployment-source enrollment. The generated
 * catalog is therefore the only deployable discovery input. This generator
 * never scans apps/services/workers independently.
 *
 * @security Only non-secret development values may enter the generated Compose
 * document. Production secrets MUST be supplied at runtime by the deployment
 * platform and are never generated into Compose.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import YAML from "yaml";

const ROOT = resolve(import.meta.dirname, "../../..");
const CATALOG_PATH = resolve(ROOT, "infrastructure/catalog.json");
const INFRA_PATH = resolve(ROOT, "infrastructure/docker/docker.yaml");
const ENVIRONMENTS_PATH = resolve(ROOT, "infrastructure/environments");
const OUTPUT_PATH = resolve(ROOT, "infrastructure/docker/docker-compose.generated.yml");
const VALID_ENVIRONMENTS = new Set(["development", "staging", "production"]);

/**
 * Reads a YAML/JSON document.
 *
 * @param {string} path - Absolute path.
 * @returns {Promise<object>} Parsed document.
 */
async function readDocument(path) {
  return YAML.parse(await readFile(path, "utf8"));
}

/**
 * Converts a manifest environment map into a plain development-safe object.
 *
 * @param {object} deployable - Catalog deployable.
 * @param {string} environment - Canonical environment name.
 * @returns {object} Environment variables.
 */
function environmentVariables(deployable, environment) {
  const values = deployable.env_vars?.[environment] ?? {};
  if (typeof values !== "object" || Array.isArray(values)) {
    throw new Error(`Invalid env_vars.${environment} for ${deployable.slug}`);
  }
  return { NODE_ENV: environment, ...values };
}

/**
 * Builds dependency declarations from capability metadata.
 *
 * @param {object} deployable - Catalog deployable.
 * @returns {object|undefined} Compose depends_on mapping.
 */
function dependencies(deployable) {
  const caps = deployable.capabilities ?? {};
  const depends = {};
  if (caps.needs_nats) depends.nats = { condition: "service_healthy" };
  if (caps.needs_redis) depends.redis = { condition: "service_healthy" };
  if (caps.needs_supabase) depends.postgres = { condition: "service_healthy" };
  return Object.keys(depends).length ? depends : undefined;
}

/**
 * Converts one Docker-enabled deployable into a Compose service.
 *
 * @param {object} deployable - Normalized catalog entry.
 * @param {string} environment - Canonical environment.
 * @returns {object|null} Compose service or null.
 */
function toComposeService(deployable, environment) {
  if (deployable.source_kind !== "local" || !deployable.docker?.enabled) return null;

  const port = deployable.container?.port ?? deployable.docker?.container_port;
  const healthPath = deployable.container?.health_path ?? deployable.docker?.health_path;
  if (!port || !healthPath) throw new Error(`Docker contract incomplete for ${deployable.slug}: container.port and container.health_path are required`);
  if (deployable.docker.container_port !== port) throw new Error(`Docker port drift for ${deployable.slug}: container.port != docker.container_port`);
  const depends = dependencies(deployable);

  return {
    build: {
      context: deployable.docker.context ?? ".",
      dockerfile: deployable.docker.dockerfile,
      target: deployable.docker.target ?? "runtime",
    },
    init: true,
    restart: "unless-stopped",
    stop_grace_period: "20s",
    networks: ["figentra"],
    environment: { ...environmentVariables(deployable, environment), FIGENTRA_ENV: environment },
    ...(depends ? { depends_on: depends } : {}),
    healthcheck: {
      test: [
        "CMD",
        "node",
        "-e",
        `fetch('http://127.0.0.1:${port}${healthPath}').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))`,
      ],
      interval: "10s",
      timeout: "5s",
      retries: 12,
      start_period: "15s",
    },
    expose: [String(port)],
  };
}

/**
 * Generates the complete Compose topology.
 *
 * @param {string} environment - Canonical environment.
 * @returns {Promise<object>} Compose document.
 */
async function generate(environment) {
  if (environment === "production") throw new Error("Production is not a local Docker Compose environment; use the provider deployment pipeline instead.");
  const catalog = await readDocument(CATALOG_PATH);
  const dockerInfra = await readDocument(INFRA_PATH);
  const environmentManifest = await readDocument(resolve(ENVIRONMENTS_PATH, `${environment}.yaml`));
  if (environmentManifest.environment !== environment) throw new Error(`Environment manifest mismatch for ${environment}`);
  const services = {};

  for (const deployable of catalog.deployables ?? []) {
    const service = toComposeService(deployable, environment);
    if (service) services[deployable.slug] = service;
  }

  for (const [name, spec] of Object.entries(dockerInfra.services ?? {})) {
    services[name] = {
      image: spec.image,
      profiles: [spec.profile ?? "infra"],
      ...(spec.ports ? { ports: spec.ports } : {}),
      ...(spec.command ? { command: spec.command } : {}),
      ...(spec.environment ? { environment: spec.environment } : {}),
      ...(spec.healthcheck ? { healthcheck: spec.healthcheck } : {}),
      networks: ["figentra"],
    };
  }

  return {
    name: "figentra",
    services,
    networks: { figentra: { name: "figentra" } },
  };
}

/**
 * Parses the requested environment without accepting legacy aliases.
 *
 * @returns {string} Canonical environment.
 */
function environmentFromArgs() {
  const arg = process.argv.find((value) => value.startsWith("--environment="));
  const environment = arg?.split("=", 2)[1] ?? process.env.FIGENTRA_ENV ?? "development";
  if (!VALID_ENVIRONMENTS.has(environment)) {
    throw new Error(`Invalid environment ${environment}; use development, staging, or production.`);
  }
  return environment;
}

const environment = environmentFromArgs();
const compose = await generate(environment);
const header = `# =============================================================================\n# GENERATED FILE — DO NOT EDIT\n# @file infrastructure/docker/docker-compose.generated.yml\n# @description Local/integration Compose topology for ${environment}.\n# @source-of-truth infrastructure/environments/<env>.yaml + infrastructure/catalog.json + docker.yaml\n# @generator infrastructure/docker/scripts/generate-compose.mjs\n# @security Secrets are forbidden in generated Compose.\n# =============================================================================\n`;
await writeFile(OUTPUT_PATH, `${header}${YAML.stringify(compose)}`, "utf8");
console.log(`✔ Docker Compose generated for ${environment}: ${OUTPUT_PATH}`);
