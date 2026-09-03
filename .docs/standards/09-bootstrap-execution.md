# Bootstrap Execution Standard

## Phase 1 — pnpm

The repository uses pnpm as its only package manager. Bootstrap requires Node.js
24+ and the pinned pnpm version.

### Frontend

Use the official HeroUI V3 CLI:

```bash
pnpm dlx heroui-cli@latest init <path> -t vite -p pnpm
```

HeroUI's CLI officially supports the Vite template and pnpm package manager.
citeturn4search0turn4search2

### NestJS

Use the official Nest CLI.

### Workers

Use the official Hono Cloudflare Workers + Vite scaffold.

## Workspace finalization

After all official generators complete:

1. remove any nested `pnpm-lock.yaml` / `pnpm-workspace.yaml` files;
2. use the root `pnpm-workspace.yaml` as the sole workspace definition;
3. normalize external dependencies to `catalog:` and internal dependencies to
   `workspace:*`;
4. run `pnpm install --frozen-lockfile`;
5. run Turbo build/typecheck/test/lint;
6. commit the generated root `pnpm-lock.yaml`.

## Integrity

A scaffold is not complete merely because its directory exists. The generator
must run, dependencies must install, and the generated project must pass its
checks.
