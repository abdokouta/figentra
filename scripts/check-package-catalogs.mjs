#!/usr/bin/env node
/**
 * @file scripts/check-package-catalogs.mjs
 * @description Validates package-level catalog.json metadata against package.json.
 * @security This scanner only reads metadata; it never resolves or executes dependencies.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];
function packageDirs(base) {
  const result = [];
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    const dir = join(base, entry.name);
    if (!entry.isDirectory()) continue;
    if (existsSync(join(dir, 'package.json'))) result.push(dir);
    else result.push(...packageDirs(dir));
  }
  return result;
}

for (const dir of packageDirs(join(root, 'packages'))) {
  const packagePath = join(dir, 'package.json');
  const catalogPath = join(dir, 'catalog.json');
  if (!existsSync(packagePath) || !existsSync(catalogPath)) {
    failures.push(`${relative(root, dir)}: package.json and catalog.json are both required`);
    continue;
  }
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const catalogName = catalog.package?.name ?? catalog.name;
  if (catalogName !== pkg.name) failures.push(`${relative(root, dir)}: catalog package name does not match package.json`);
  const peers = Object.keys(pkg.peerDependencies ?? {}).sort();
  const catalogPeers = [...(catalog.peer_deps ?? [])].sort();
  if (JSON.stringify(peers) !== JSON.stringify(catalogPeers)) failures.push(`${relative(root, dir)}: catalog peer_deps do not match peerDependencies`);
  if (!catalog.purpose) failures.push(`${relative(root, dir)}: catalog purpose is required`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Package catalog consistency passed.');
