/**
 * @file zone-registry.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token that resolves the `IZoneRegistry` — the
 *   store every `<Host>Module.forFeature({ zones })` registrar
 *   writes into, and every `<Zone>` renderer reads from.
 *
 *   Concrete implementation ships in `@stackra/zones/core` as
 *   `ZoneRegistry extends BaseRegistry<string, IZoneContribution[]>`.
 *   `@stackra/zones` binds the concrete class to this token via
 *   `useExisting` inside `ZonesModule.forRoot(...)`.
 *
 *   Uses `Symbol.for(...)` with a package-namespaced registry key so
 *   the token's identity survives dual-instance loading of
 *   `@stackra/contracts` (pnpm phantom hoists, mixed ESM/CJS graphs,
 *   Vite dev-server hot reloads). A plain `Symbol(...)` would produce
 *   a distinct instance-local symbol per module realm, which silently
 *   splits the registrar's write from the renderer's read.
 */

/**
 * DI token — resolves an implementation of `IZoneRegistry` from
 * `@stackra/contracts/interfaces/zones`.
 */
export const ZONE_REGISTRY = Symbol.for("@stackra/zones/ZONE_REGISTRY");
