#!/usr/bin/env node
/**
 * @file infrastructure/docker/scripts/validate-compose.mjs
 * @description Static validator for the generated Figentra Compose topology.
 *
 * Docker itself remains the final schema validator (`docker compose config`).
 * This script enforces Figentra-specific invariants before Docker is invoked.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

const root = resolve(import.meta.dirname, "../../..");
const path = resolve(root, "infrastructure/docker/docker-compose.generated.yml");
const document = parse(readFileSync(path, "utf8"));
const catalog = JSON.parse(readFileSync(resolve(root, "infrastructure/catalog.json"), "utf8"));
const errors = [];
const forbiddenSecretKeys = /token|password|secret|private[_-]?key|api[_-]?key/i;

/** Recursively validates generated values for accidental secret configuration. */
function scan(value, location = "$") {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}.${key}`;
    if (forbiddenSecretKeys.test(key)) errors.push(`${childLocation}: secret-bearing key is forbidden`);
    scan(child, childLocation);
  }
}

if (document?.name !== "figentra") errors.push("root name must be figentra");
if (!document?.services || typeof document.services !== "object") errors.push("services must be an object");
if (!document?.networks?.figentra) errors.push("figentra network is required");
const expectedServices = (catalog.deployables ?? []).filter(d => d.docker?.enabled).map(d => d.slug);
for (const name of expectedServices) {
  const service = document.services?.[name];
  if (!service) errors.push(`${name}: missing from generated Compose`);
  else if (!service.healthcheck) errors.push(`${name}: healthcheck is required`);
}

for (const [name, service] of Object.entries(document.services ?? {})) {
  if (service.build) {
    const dockerfile = resolve(root, service.build.dockerfile);
    if (!existsSync(dockerfile)) errors.push(`${name}: Dockerfile does not exist: ${service.build.dockerfile}`);
  }
  if (service.environment?.NODE_ENV === "production") errors.push(`${name}: generated Compose must not embed production NODE_ENV`);
  if (service.ports && !service.profiles?.includes("infra")) errors.push(`${name}: application containers must not publish host ports`);
}
scan(document);

if (errors.length) {
  console.error("Docker Compose contract failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("Docker Compose contract passed.");
