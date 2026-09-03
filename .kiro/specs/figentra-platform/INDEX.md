# Figentra Platform — Kiro Specification Index

Read `README.md` first. It is the complete architecture/engineering contract.
Then use `00-implementation-checklist.md` and the component directories for
implementation.

## Directories

- `services/` — deployable NestJS bounded contexts
- `packages/` — reusable platform libraries/contracts
- `workers/` — Cloudflare edge/control-plane workers
- `apps/` — web/mobile/public applications
- `stackra/` — external Stackra package usage contracts

## Rule

No implementation task is complete if it satisfies code compilation but violates
its component spec. Any required architectural deviation becomes an ADR before
implementation.
