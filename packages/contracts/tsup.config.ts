/**
 * @file tsup.config.ts
 * @module @stackra/contracts/tsup
 * @description Build config for @stackra/contracts.
 *
 *   `.d.ts` output is REQUIRED — the contracts package is the
 *   zero-runtime vocabulary every downstream consumer types
 *   against. Every subpath in `package.json.exports.types` MUST
 *   resolve at consume time, otherwise TypeScript flags TS7016
 *   ("Could not find a declaration file for module
 *   '@stackra/contracts'") across every consumer.
 *
 *   The workspace-wide `dts: false` legacy documented as
 *   "@heroui-pro/react ships broken exports.types" only bites
 *   packages that transitively import from `@heroui-pro/react`
 *   (i.e. `@stackra/ui`). Contracts is a leaf package with no
 *   HeroUI imports, so dts generation runs cleanly.
 */

import { defineBaseConfig } from "@stackra/tsup-config";

export default defineBaseConfig(
  {
    index: "src/index.ts",
  },
  { dts: true },
);
