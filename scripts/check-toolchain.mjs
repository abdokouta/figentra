#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const required = String(pkg.packageManager ?? "").replace(/^pnpm@/, "");
const nodeMajor = Number(process.versions.node.split(".")[0]);
const failures = [];
if (nodeMajor < 24) failures.push(`Node.js >=24 is required (found ${process.versions.node})`);
if (!required) failures.push("package.json must declare packageManager=pnpm@<version>");
try {
  const actual = execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim();
  if (actual !== required) failures.push(`pnpm ${required} is required (found ${actual})`);
} catch {
  failures.push(`pnpm ${required} is required but pnpm is not installed/available`);
}
if (failures.length) { console.error(failures.map((x) => `- ${x}`).join("\n")); process.exit(1); }
console.log(`Toolchain contract passed: Node ${process.versions.node}, pnpm ${required}`);
