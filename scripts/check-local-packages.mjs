import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};

const configs = {
  "oxlint-config": [
    "./src/base.jsonc",
    "./src/react.jsonc",
    "./src/native.jsonc",
    "./src/nest.jsonc",
    "./src/worker.jsonc",
  ],
  "prettier-config": ["./src/index.mjs"],
  "typescript-config": [
    "./src/base.json",
    "./src/react-library.json",
    "./src/vite.json",
    "./src/vite-node.json",
    "./src/native.json",
    "./src/worker.json",
    "./src/nest.json",
  ],
};

for (const [name, expectedExports] of Object.entries(configs)) {
  const dir = path.join(root, "packages", "config", name);
  const packageFile = path.join(dir, "package.json");
  if (!fs.existsSync(packageFile)) {
    fail(`missing ${name}`);
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
  const exports = pkg.exports ?? {};
  for (const target of expectedExports) {
    if (!JSON.stringify(exports).includes(target)) fail(`${name}: export map missing ${target}`);
    if (!fs.existsSync(path.join(dir, target.slice(2)))) fail(`${name}: source missing ${target}`);
  }
}

for (const name of ["container", "contracts", "network", "support", "testing"]) {
  if (!fs.existsSync(path.join(root, "packages", name, "package.json"))) fail(`missing runtime package ${name}`);
}

for (const app of ["family", "landing-page", "portal"]) {
  if (!fs.existsSync(path.join(root, "apps", app, "src", "app.module.ts"))) fail(`${app}: missing app.module.ts`);
}

if (fs.existsSync(path.join(root, "packages", "eslint-config"))) fail("obsolete packages/eslint-config must not exist");

if (!process.exitCode) console.log("✓ local packages and application composition passed");
