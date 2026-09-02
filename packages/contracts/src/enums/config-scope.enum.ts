/**
 * @file config-scope.enum.ts
 * @module @stackra/contracts/enums
 * @description Merge strategy declared per config factory registration.
 *
 *   Every factory registered with `@stackra/config` — whether via
 *   `ConfigModule.forRoot({ load: [...] })` (app-level) or
 *   `ConfigModule.forFeature(factory, { scope })` (framework-level) —
 *   carries a `ConfigScope` that tells the merged useFactory how to
 *   fold its output into the accumulated shape for the namespace.
 *
 *   Read alongside:
 *   - ADR-0063 — Unified DI-first config pattern
 *   - `.kiro/steering/package-conventions.md` §"Config authoring"
 *   - `.kiro/steering/frontend-modules.md` §"ConfigModule cascade"
 *
 *   The four strategies produce Laravel-parity semantics by default:
 *   framework packages self-register as `Baseline` (fills gaps), apps
 *   layer overrides as `Merge` (wins per field, preserves gaps), and
 *   the resolved shape a consumer sees at `@Inject(<TOKEN>)` is the
 *   deep-merge of every registration in load order.
 */

/**
 * Merge strategy applied when a config factory contributes to a
 * namespace slot in `@stackra/config`.
 *
 * Every strategy is applied by the merged public provider's
 * `useFactory` — see
 * `packages/frontend/config/src/core/config.module.ts` for the exact
 * fold logic.
 */
export enum ConfigScope {
  /**
   * Deep-merge UNDER the existing accumulated shape. Fields already
   * set by an earlier factory WIN; this factory only fills gaps.
   *
   * Framework packages use `Baseline` when self-registering their
   * `<pkg>.config.ts` via `ConfigModule.forFeature(...)` — the app's
   * override lands on top and wins per field, while every field the
   * app didn't declare inherits from this baseline.
   *
   * Matches Laravel's `mergeConfigFrom(...)` semantic — vendor default
   * is a fallback, app config is source of truth.
   */
  Baseline = "baseline",

  /**
   * Deep-merge OVER the existing accumulated shape. This factory
   * WINS per field; fields already set that this factory doesn't
   * touch are preserved.
   *
   * Default strategy for app-level `ConfigModule.forRoot({ load })`
   * entries. Apps override what they declare, everything else
   * inherits from the framework baseline registered via
   * `ConfigModule.forFeature(..., { scope: Baseline })`.
   */
  Merge = "merge",

  /**
   * Wholesale replace the accumulated shape. Every field this
   * factory doesn't declare is DROPPED.
   *
   * Reserved for callers that explicitly own an entire slot — e.g.
   * the legacy `<Pkg>Module.forRoot(options)` static path binds the
   * caller-supplied options via `Override` because passing options
   * directly is intended as "I own this shape, discard framework
   * defaults".
   */
  Override = "override",

  /**
   * Apply ONLY when the accumulated shape is empty (no prior
   * factory has contributed). Useful for bootstrap-only defaults
   * that must not clobber any real registration.
   *
   * Rare — the intent is "seed the slot if nobody else has, but
   * step aside the moment a real factory registers".
   */
  Guard = "guard",
}
