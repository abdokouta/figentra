#!/usr/bin/env node
/**
 * @file scripts/check-docblocks.mjs
 * @description Figentra source file.
 *
 * This file is governed by the repository code/documentation standard. Public
 * symbols and non-obvious architectural decisions require TSDoc/comments.
 */
/**
 * Figentra documentation quality gate.
 *
 * Checks exported TypeScript symbols in owned source trees for a nearby TSDoc
 * block. The rule is intentionally conservative: generated/config files and
 * tests are excluded, while public application/service/worker code is checked.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const roots = ["apps", "services", "workers", "packages"];
const sourcePattern = /\.(ts|tsx)$/;
const ignored = /(^|\/)(test|tests|node_modules|dist|coverage)(\/|$)|(\.spec|\.e2e-spec)\.(ts|tsx)$/;

const failures = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (ignored.test(rel)) continue;
    if (entry.isDirectory()) walk(full);
    else if (sourcePattern.test(entry.name)) check(full, rel);
  }
}

function check(file, rel) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^\s*export\s+(default\s+)?(class|interface|type|function|const|enum)\b/.test(lines[i])) {
      continue;
    }

    let j = i - 1;
    while (j >= 0 && (/^\s*$/.test(lines[j]) || /^\s*@(Injectable|Controller|Module|Catch|UseGuards|UseInterceptors|UsePipes|SetMetadata)\b/.test(lines[j]) || /^\s*\/\//.test(lines[j]))) j -= 1;

    if (j < 0 || !/\*\/\s*$/.test(lines[j])) {
      failures.push(`${rel}:${i + 1} exported symbol is missing TSDoc`);
    }
  }
}

for (const dir of roots) walk(path.join(root, dir));

if (failures.length) {
  console.error("Documentation gate failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Documentation gate passed.");
