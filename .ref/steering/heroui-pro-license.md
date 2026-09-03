---
inclusion: fileMatch
fileMatchPattern:
  [
    "package.json workspaces",
    "frontend/packages/ui/package.json",
    "frontend/packages/*/package.json",
  ]
---

# HeroUI Pro licensed peers — install + version-pin rules

`@heroui-pro/react` and `heroui-native-pro` are commercial packages. The npm
tarballs ship as ~4 KB stubs; the licensed dist (~4.5 MB for React, ~2 MB for
Native) downloads at postinstall time from HeroUI's private CDN. Two rules every
agent and human reading this MUST follow:

## Rule 1 — a stuck stub is not a build bug

If `pnpm build` on any `@stackra/*` package that consumes `@stackra/ui` fails
with:

```
Error: Could not resolve "@heroui-pro/react" imported by "@stackra/ui"
```

or

```
error TS2305: Module '"@heroui-pro/react"' has no exported member
  'EmptyState' | 'cn' | 'tv' | 'VariantProps' | ...
```

the fix is NEVER "add the missing export to `@stackra/ui`" or "install the
package". The package IS installed — as a stub. The postinstall failed to
authenticate. Verify:

```bash
ls node_modules/.pnpm/@heroui-pro+react@1.0.0-beta.6/node_modules/@heroui-pro/react/dist
```

- Only `postinstall/` present → stub. Postinstall never ran or auth failed.
- `components/ css/ libs/ utils/ heroui-pro.min.css` all present → hydrated.

Hydrate a stuck stub with the two convenience scripts — they encapsulate the
working-directory gotcha:

```bash
# Step 1 — one-time OAuth login. Run from anywhere.
pnpm heroui:login       # wraps: pnpm dlx heroui-pro@latest login

# Step 2 — hydrate the stubs.
pnpm heroui:setup       # wraps: cd frontend/packages/ui && pnpm dlx heroui-pro@latest install
```

Why the `cd` matters — do NOT skip it. The `heroui-pro` CLI looks for
`./node_modules/@heroui-pro/react` (flat layout). At the monorepo root pnpm
hoists everything to `./node_modules/.pnpm/`, so the CLI silently reports
"Cannot find in node_modules" and exits without downloading. Inside
`frontend/packages/ui/` (the only workspace that directly declares both licensed
packages as peers), pnpm creates the flat symlink the CLI expects and the
download completes successfully.

If the CLI reports "Using cached ... vX.Y.Z" that doesn't match the catalog pin,
clear the CLI's version-agnostic cache first:

```bash
rm -rf ~/Library/Caches/heroui-pro   # macOS
pnpm heroui:setup
```

**`pnpm rebuild @heroui-pro/react heroui-native-pro` does NOT work** as an
alternative — the postinstall it fires still runs against the monorepo root's
flat-layout check and silently no-ops. Always use `pnpm heroui:setup` (or the
underlying `cd frontend/packages/ui && pnpm dlx heroui-pro@latest install`).

## Rule 2 — do NOT bump past `1.0.0-beta.6`

`@heroui-pro/react@1.0.0-beta.7` is a **major API redesign**. It:

- Removes `EmptyState`, `cn`, `tv`, `VariantProps` from the top-level barrel.
- Removes the `./utils` and `./libs` re-exports from the barrel.
- Moves every component to subpath exports (`@heroui-pro/react/agenda`,
  `@heroui-pro/react/app-layout`, ...).

The workspace's `@stackra/ui` is authored against beta.6's API surface. Bumping
the catalog to beta.7 breaks the `@stackra/ui` build immediately.

Both entries in `package.json workspaces` STAY pinned to `1.0.0-beta.6` until an ADR
reconciles the beta.7 breaking changes:

```yaml
catalog:
  "@heroui-pro/react": 1.0.0-beta.6 # DO NOT BUMP
  heroui-native-pro: 1.0.0-beta.6 # DO NOT BUMP
```

If a CLI or an agent action bumps these unintentionally
(`npx heroui-pro update`, `pnpm update --latest`, catalog-refresh scripts),
revert the change before committing.

## What already exists in the docs

- Root
  [README.md §"HeroUI Pro licensed peers — one-time setup"](../../README.md) —
  full onboarding walkthrough for humans.
- [`frontend/packages/ui/README.md` §"pnpm approvals for HeroUI Pro"](../../frontend/packages/ui/README.md)
  — the same setup + troubleshooting from the UI package's perspective.

This steering doc is the ENFORCEMENT counterpart of those — auto-injects into
agent context whenever `package.json workspaces` or a frontend package's
`package.json` is touched, so no agent silently bumps the catalog past beta.6 or
"helpfully" installs a missing `@heroui-pro/react` export.

## Auth token vs OAuth — pick per environment

| Environment           | Auth path                      | Where credentials live            |
| --------------------- | ------------------------------ | --------------------------------- |
| Developer laptop      | `npx heroui-pro login` (OAuth) | OS keyring (Keychain / libsecret) |
| CI / Docker / servers | `HEROUI_AUTH_TOKEN` env var    | Doppler / GitHub Actions secret   |

`.env.example` documents `HEROUI_AUTH_TOKEN` as required for CI runs. Developer
laptops do NOT need the env var — the keyring path takes precedence.
