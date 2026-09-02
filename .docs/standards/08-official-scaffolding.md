# Official Scaffolding Standard

**Status: APPROVED**

Use official upstream generators whenever they exist.

## HeroUI V3 + Vite

```bash
npx heroui-cli@latest init apps/portal -t vite -p npm
npx heroui-cli@latest init apps/landing-page -t vite -p npm
```

HeroUI's current documentation lists Vite as an official template and the CLI
supports `-t vite` and `-p npm`. HeroUI v3 requires React 19+ and Tailwind CSS
v4 and does not require `HeroUIProvider`. citeturn4search0turn4search2

## NestJS

```bash
nest new <service> --package-manager npm --strict
```

Then apply the Figentra service standard.

## Hono

```bash
npm create hono@latest <worker> -- --template cloudflare-workers+vite
```

## Convoy

Use the upstream Docker/self-hosted deployment model.

## Rule

Templates establish framework defaults. Figentra standards establish the
architecture, security, observability, dependency and documentation rules.
