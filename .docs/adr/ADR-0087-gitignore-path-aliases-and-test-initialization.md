# ADR-0087 — Monorepo Gitignore, Path Aliases, and Test Initialization Standardization

**Status:** Accepted  
**Date:** 2026-09-02  
**Owner:** Platform Architecture & Engineering Standards  

---

## 1. Context

As the Figentra monorepo grew to encompass 40+ packages, services, workers, and applications, several inconsistencies emerged across development toolchains:

1. **Distributed `.gitignore` Files**: Subdirectory `.gitignore` files were scattered across apps, packages, and workers. Several contained obsolete rules that attempted to ignore root lockfiles (`pnpm-lock.yaml`) or duplicated standard root exclusions (`node_modules/`, `dist/`, `.turbo/`).
2. **Fragile Relative Imports in Tests**: Unit and integration test suites frequently used fragile multi-level relative paths (e.g. `../../src/app` or `../../../services/user.service`), making refactoring and directory restructuring prone to broken imports.
3. **Inconsistent Vitest Lifecycle Hooks**: Test setup files (`vitest.setup.ts`) varied between importing the shared `@stackra/testing/setup` hook, inlining partial `beforeEach`/`afterEach` resets, or omitting lifecycle cleanup entirely.

---

## 2. Decisions

### 2.1 Single Canonical Root `.gitignore`
- **Rule**: All file exclusions are centralized in the single repository root [`.gitignore`](../../.gitignore).
- **Constraint**: No subdirectory or workspace member package may define its own `.gitignore` file.
- **Scope**: Covers dependencies, environment files, build artifacts (`dist`, `build`, `web-build`), Cloudflare Wrangler state (`.wrangler/`), Terraform state, mobile/Expo artifacts, and OS/editor metadata uniformly across all projects.

### 2.2 Universal `@/*` Path Alias Convention
- **Rule**: Every TypeScript project in the monorepo maps `@/*` to `./src/*`.
- **TypeScript Configuration**: Inherited from `@stackra/typescript-config/base` via `"paths": { "@/*": ["./src/*"] }`.
- **Test Runner Resolution**: All `vitest.config.ts` configurations must resolve `@/*` to the project's `./src` directory (via `vite-tsconfig-paths` or explicit `resolve.alias`).
- **Usage**: Internal source and test imports reference `@/...` (e.g. `import { createRegistry } from "@/app";`) rather than traversing directory trees with `../../src/`.

### 2.3 Canonical `@stackra/testing/setup` Test Lifecycle
- **Rule**: Every testable workspace member must maintain `__tests__/vitest.setup.ts` importing `@stackra/testing/setup`.
- **Dependency**: Workspace members with test suites must include `"@stackra/testing": "workspace:*"` in `devDependencies`.
- **Behavior**: Guarantees deterministic test isolation across every suite by resetting timer mocks, restoring spies, and clearing stubbed globals and environment variables between test cases:
  ```ts
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  ```
- **Service Environment Overrides**: Any offline test defaults (such as disabling external DB/NATS connections) must be declared explicitly *below* the `@stackra/testing/setup` import.

---

## 3. Consequences

- **Positive**: Clean repository auditability with one `.gitignore`, robust and refactor-safe test imports, and zero state leakage between test executions across the monorepo.
- **Enforcement**: Monorepo standards validators (`pnpm run standards:check`) and CI lint checks verify compliance with these patterns.
