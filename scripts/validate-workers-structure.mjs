/**
 * @file validate-workers-structure.mjs
 * @description Static structural gate for production Worker conventions.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../workers/', import.meta.url).pathname;
const workers = readdirSync(root).filter((name) => statSync(join(root, name)).isDirectory());
const failures = [];
for (const worker of workers) {
  const base = join(root, worker);
  for (const file of ['package.json','cloud.yaml','wrangler.jsonc','README.md','tsconfig.json']) {
    if (!existsSync(join(base,file))) failures.push(`${worker}: missing ${file}`);
  }
  for (const file of ['src/index.ts','src/app.ts']) {
    if (!existsSync(join(base,file))) failures.push(`${worker}: missing ${file}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Worker structure gate passed for ${workers.length} workers.`);
