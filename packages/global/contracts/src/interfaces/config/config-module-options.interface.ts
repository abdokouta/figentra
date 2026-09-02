/**
 * @file config-module-options.interface.ts
 * @module @stackra/contracts/interfaces/config
 * @description Options accepted by `ConfigModule.forRoot`.
 *
 * @derived @nestjs/config@4.0.4 — lib/interfaces/config-module-options.interface.ts (MIT, © Kamil Myśliwiec)
 */

import type { ConfigScope } from "../../enums/config-scope.enum";
import type { Parser } from "../../types/config/parser.type";
import type { IConfigFactory } from "./config-factory.interface";

/**
 * Entry accepted by `ConfigModule.forRoot({ load: [...] })`.
 *
 * Callers may pass either:
 *
 * - A bare `IConfigFactory` — default `ConfigScope.Merge` applies
 *   (deep-merge over the accumulated shape, this factory wins per
 *   field). Matches Laravel's app-config-wins semantics.
 * - A wrapped `{ config, scope }` envelope — declare the merge
 *   strategy explicitly. Used when the app wants to layer a factory
 *   as a baseline / override / guard rather than the default merge.
 */
export type ConfigLoadEntry =
  | IConfigFactory
  | { readonly config: IConfigFactory; readonly scope: ConfigScope };

/**
 * Options accepted by `ConfigModule.forRoot`.
 *
 * @typeParam ValidationOptions - Shape of the validator-specific option
 *   bag passed to `validationSchema.validate`. Defaults to a permissive
 *   `Record<string, unknown>` — swap in `Joi.ValidationOptions` (etc.)
 *   at the call site to tighten.
 * @publicApi
 */
export interface IConfigModuleOptions<
  ValidationOptions extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * When `true`, values read through `ConfigService` are memoised.
   *
   * Improves lookup performance for hot paths at the cost of stale
   * reads after `ConfigService.set`. See
   * https://github.com/nodejs/node/issues/3104 for context on why
   * `process.env` reads benefit from caching.
   *
   * @default false
   */
  cache?: boolean;

  /**
   * When `true`, registers `ConfigModule` as a global module — its
   * providers are visible to every module without an explicit
   * `imports` edge.
   *
   * @default false
   */
  isGlobal?: boolean;

  /**
   * When `true`, environment files (`.env`) are ignored — only
   * `process.env` (Node) / `import.meta.env` (Vite) / `globalThis.__ENV__`
   * (custom) contribute to the resolved config.
   *
   * @default false
   */
  ignoreEnvFile?: boolean;

  /**
   * When `true`, predefined environment variables (variables already
   * present in `process.env` before the module loaded) are not
   * validated.
   *
   * @deprecated Prefer `validatePredefined: false`. Kept for
   *   `@nestjs/config` API parity; will be removed in a future major.
   */
  ignoreEnvVars?: boolean;

  /**
   * Path(s) to env file(s) to load. Ignored in browser runtimes; only
   * consulted by `@stackra/config` when `isNode()` is true.
   */
  envFilePath?: string | string[];

  /**
   * Custom function to validate + transform the flat env record.
   *
   * Called with the merged env record (env-file → process.env) and
   * must return a validated record. Throwing aborts module init and
   * prevents application bootstrap. Mutations to the returned record
   * are reflected in `process.env` (Node) after `ConfigModule.forRoot`
   * resolves.
   *
   * Use this for Zod / valibot / hand-rolled schemas —
   * `validationSchema` is Joi-specific.
   */
  validate?: (config: Record<string, unknown>) => Record<string, unknown>;

  /**
   * When `true`, predefined environment variables (variables already
   * present in `process.env` before the module loaded) are validated
   * by the `validate` function / `validationSchema`.
   *
   * @default true
   */
  validatePredefined?: boolean;

  /**
   * When `true`, `ConfigService.get` skips reading `process.env` — only
   * loaded config namespaces + validated env are consulted.
   *
   * @default false
   */
  skipProcessEnv?: boolean;

  /**
   * Joi (or Joi-compatible) validation schema. When set, the merged
   * env record is passed through `schema.validate(...)` before any
   * namespace factory runs. Prefer `validate` for non-Joi schemas.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validationSchema?: any;

  /**
   * Options bag forwarded to `validationSchema.validate(config, opts)`.
   * See https://joi.dev/api/?v=17.3.0#anyvalidatevalue-options for
   * Joi's option list.
   */
  validationOptions?: ValidationOptions;

  /**
   * Custom namespaced config factories to load, produced by
   * `registerAs(...)`. Each entry's return value is folded into the
   * merged shape for its namespace per its `ConfigScope`.
   *
   * Bare entries default to `ConfigScope.Merge` (deep-merge over the
   * accumulated shape, this factory wins per field). Wrap the entry
   * as `{ config, scope }` to declare a different strategy.
   *
   * The order of entries in the array is the load order. Framework
   * baselines registered via `ConfigModule.forFeature(...)` fold in
   * BEFORE any `load` entries — the fold order is
   * `[baselines from forFeature, load[0], load[1], ...]`.
   */
  load?: Array<ConfigLoadEntry | Promise<ConfigLoadEntry>>;

  /**
   * When `true`, `${VAR}` references inside env-file values are
   * expanded via `dotenv-expand`. When an object, it is forwarded to
   * `dotenv-expand`'s options. Ignored in browser runtimes (Vite
   * handles interpolation at build time).
   *
   * @default false
   */
  expandVariables?: boolean | Record<string, unknown>;

  /**
   * When `true`, values from the env file(s) override values already
   * present in `process.env`. When `false`, `process.env` wins.
   *
   * @default false
   */
  override?: boolean;

  /**
   * Custom parser used to turn an env-file buffer into a flat record.
   * Defaults to `dotenv`'s parser in Node runtimes.
   */
  parser?: Parser;
}
