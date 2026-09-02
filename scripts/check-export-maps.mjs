#!/usr/bin/env node
/**
 * @file scripts/check-export-maps.mjs
 * @description Validates JavaScript/TypeScript package export maps.
 * @remarks Static configuration packages are validated against their declared
 * file exports instead of being forced into the runtime dist/index contract.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const failures=[];
const staticPackages=new Set(['oxlint-config','prettier-config','typescript-config']);
const sourceEntries={container:'src/core/index.ts',testing:'src/core/index.ts'};
function packageDirs(base) {
  const result=[];
  for (const entry of readdirSync(base,{withFileTypes:true})) {
    const dir=join(base,entry.name);
    if (!entry.isDirectory()) continue;
    if (existsSync(join(dir,'package.json'))) result.push(dir);
    else result.push(...packageDirs(dir));
  }
  return result;
}
for(const dir of packageDirs('packages')) {
  const entryName=dir.split('/').at(-1);
  const pkg=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'));
  if(staticPackages.has(entryName)){
    if(!pkg.exports) failures.push(`${dir}: static config package must declare exports`);
    for(const target of Object.values(pkg.exports??{})){
      const targets=typeof target==='string' ? [target] : Object.values(target??{});
      for(const file of targets) if(typeof file==='string' && !existsSync(join(dir,file))) failures.push(`${dir}: exported file missing: ${file}`);
    }
    continue;
  }
  const rootExport=pkg.exports?.['.'];
  if(!rootExport || !['./dist/index.js','./dist/index.mjs'].includes(rootExport.import) || rootExport.types !== './dist/index.d.ts') failures.push(`${dir}: root export must expose a dist/index JS/MJS entry and dist/index.d.ts`);
  const sourceEntry=sourceEntries[entryName] ?? 'src/index.ts';
  if(!existsSync(join(dir,sourceEntry))) failures.push(`${dir}: ${sourceEntry} missing`);
}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Package export map validation passed.');
