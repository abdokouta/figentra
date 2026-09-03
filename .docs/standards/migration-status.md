# Repository Standardization Migration Status

## Completed in this repository pass

- Canonical environment naming is documented as `development`, `staging`, and
  `production`; `dev`, `stg`, and `prd` remain CLI aliases.
- Publishable packages receive package metadata, catalog metadata, Stackra
  TypeScript/tsup/Vitest configuration, and standard scripts.
- Services receive standardized test layout/configuration, i18n source
  scaffolding, and package scripts.
- Workers and applications receive standardized Vitest/test layouts and quality
  scripts.
- Legacy service `test/` directories are migrated into `__tests__/integration/`.

## External activation gates

Actual provider provisioning, production secrets, real deployments, load tests
against live infrastructure, rollback drills, and production change approval
cannot be completed from repository-only execution. Those remain explicit
operational gates in `TASKLIST.md`.
