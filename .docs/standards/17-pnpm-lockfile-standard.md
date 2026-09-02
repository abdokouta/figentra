# pnpm Lockfile Standard

**Status: APPROVED**

## Rules

- The repository has exactly one lockfile: root `pnpm-lock.yaml`.
- Nested package/application lockfiles are forbidden.
- CI uses `pnpm install --frozen-lockfile`.
- Docker builds use `pnpm install --frozen-lockfile`.
- Dependency changes must update `pnpm-lock.yaml` in the same change.
- A missing or stale lockfile is a hard CI failure.
- Never hand-author or partially reconstruct a lockfile.

## Generation

From a networked environment with the pinned toolchain:

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install
```

The generated root `pnpm-lock.yaml` must be committed and then verified with:

```bash
pnpm install --frozen-lockfile
pnpm run dependencies:check
```
