import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", ".git", "dist", "coverage", ".turbo"]);
const packageFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "package.json") packageFiles.push(full);
  }
}
walk(root);
const workspace = fs.readFileSync(path.join(root, "pnpm-workspace.yaml"), "utf8");
const catalog = new Set();
const section = workspace.split("catalog:\n", 2)[1]?.split("catalogMode:", 1)[0] ?? "";
for (const line of section.split("\n")) {
  const match = line.match(/^  ['"]?([^'"]+)['"]?:/);
  if (match) catalog.add(match[1]);
}
const failures = [];
const referencedCatalogs = new Set();
for (const file of packageFiles) {
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const sectionName of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    for (const [name, spec] of Object.entries(pkg[sectionName] ?? {})) {
      if (name.startsWith("@stackra/") || name.startsWith("@figentra/")) {
        if (spec !== "workspace:*") failures.push(`${path.relative(root, file)}: ${name} must use workspace:*`);
      } else {
        if (spec === "catalog:") referencedCatalogs.add(name);
        else failures.push(`${path.relative(root, file)}: ${name} must use catalog: (found ${spec})`);
      }
    }
  }
}
for (const name of referencedCatalogs) if (!catalog.has(name)) failures.push(`Missing catalog entry: ${name}`);
for (const name of catalog) if (!referencedCatalogs.has(name)) failures.push(`Unused catalog entry: ${name}`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Dependency policy OK: ${packageFiles.length} package.json files checked; ${catalog.size} catalog entries used.`);
