# @stackra/prettier-config

Canonical Prettier configuration for the `stackra-frontend` monorepo.

## Usage

Root `prettier.config.mjs`:

```js
export { default } from "@stackra/prettier-config";
```

Per-package (rarely needed — Prettier resolves upward):

```js
export { default } from "@stackra/prettier-config";
```

## What it sets

- 100-char line width, LF line endings, 2-space tabs
- Double quotes, trailing commas everywhere, always-arrow-parens
- `prettier-plugin-tailwindcss` wired against
  `packages/frontend/ui/src/react/styles/globals.css`
- Per-filetype overrides for JSON (no trailing commas) + Markdown (80-col prose
  wrap)

## Override

Consumers who need a different setting compose over the default:

```js
import base from "@stackra/prettier-config";

export default {
  ...base,
  printWidth: 120,
};
```
