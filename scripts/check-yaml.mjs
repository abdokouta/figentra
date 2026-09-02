#!/usr/bin/env node
/**
 * @file scripts/check-yaml.mjs
 * @description Validates repository YAML/YML configuration without relying on
 * a third-party filesystem globber so the standards gate can run before npm
 * dependencies have been installed.
 * @remarks GitLab's `!reference` tag is accepted as a custom YAML tag.
 */
import { readFile } from "node:fs/promises";
import { glob } from "node:fs";
import YAML from "yaml";

/**
 * Recursively collect YAML files while excluding generated/vendor directories.
 *
 * @returns {Promise<string[]>} Repository-relative YAML paths.
 */
async function collectYamlFiles() {
  const matches = [];
  for await (const file of glob("**/*.{yaml,yml}", {
    exclude: (entry) => {
      const value = entry.name;
      return value.includes("/node_modules/") || value.includes("/.git/") ||
        value.includes("/dist/") || value.includes("/coverage/");
    },
  })) matches.push(file);
  return matches.sort();
}

const files = await collectYamlFiles();
let failures = 0;
for (const file of files) {
  try {
    YAML.parse(await readFile(file, "utf8"), { customTags: ["!reference"] });
  } catch (error) {
    failures += 1;
    console.error(`[yaml] ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failures > 0) process.exit(1);
console.log(`Validated ${files.length} YAML/YML files.`);
