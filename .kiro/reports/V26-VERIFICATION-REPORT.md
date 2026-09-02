# V26 Verification Report

## Source-level gates

- PASS — repository standards
- PASS — package catalog consistency
- PASS — package export maps
- PASS — npm dependency policy
- PASS — documentation/docblocks gate
- PASS — worker structure gate (3 workers)
- PASS — messaging/security contract gate
- BLOCKED — YAML runtime parser check until npm dependencies are installed

## npm installation

The repository no longer has pnpm dependency protocols or pnpm package scripts.
The first local npm attempt exposed an npm override conflict for the local
Stackra config packages. Those local-package overrides were removed because
npm workspaces already provide the correct local resolution boundary.

A second install attempt in the execution environment could not reach
registry.npmjs.org (EAI_AGAIN/timeout). Therefore no package-lock.json was
fabricated.

Run locally with the user's Node 24 environment:

```bash
npm install -vvv 2>&1 | tee npm-install.log
```

## Stackra registry compatibility note

The runtime Stackra packages remain registry dependencies. Current npm registry
metadata shows `@stackra/http` 2.0.0, `@stackra/container` 2.0.0,
`@stackra/decorators` 3.0.0, and `@stackra/dashboard` 1.0.2. The earlier npm
ERESOLVE involving decorators 1.x vs 2.x is therefore an upstream Stackra peer
metadata compatibility issue, not a local-workspace resolution issue. Do not
use `--legacy-peer-deps` as the production fix; resolve the Stackra package
compatibility matrix or obtain a compatible dashboard release.

## Script fixes

- npm script-to-script invocations use `npm run`.
- Makefiles no longer invoke pnpm.
- CI and release scripts no longer use invalid `npm check` / `npm build` forms.
- Package catalog checker supports the repository's actual catalog schema.
- Export checker distinguishes static config packages from compiled packages.
- Dependency policy now validates npm explicit versions and internal workspace
  version alignment instead of requiring pnpm catalog/workspace protocols.
- YAML checker no longer depends on the `glob` package; it still requires the
  declared `yaml` dependency during a normal npm install.
