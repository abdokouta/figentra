# Figentra Repository Structure

The repository is organized by ownership and execution responsibility.

```text
apps/       deployable applications
services/   canonical business services
workers/    independent Cloudflare workers
packages/   reusable capabilities and runtime foundations
docs/       canonical company, product and engineering documentation
.kiro/      Kiro specifications, plans, agents, steering, skills and hooks
.clinerules Cline-specific rule projections
.cline/     Cline-specific skills, agents and workspace configuration
infrastructure/ environment and deployment definitions
```

Business modules are vertically complete and live under their owning service/application `src/modules/<capability>/`. Avoid global repositories/controllers/jobs directories that scatter ownership.

Agent-system source of truth lives under `docs/engineering-system/`; `.kiro/`, `.clinerules/` and `.cline/` are adapters for individual development tools.

When creating a new directory, first identify the owner and whether it is canonical source, generated projection, implementation, or tool adapter.