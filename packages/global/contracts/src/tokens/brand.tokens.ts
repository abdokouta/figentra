/**
 * @file brand.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the brand subsystem.
 *
 *   The brand package holds ONE identity metadata bag per app.
 *   Boot-time configuration flows through `BRAND_CONFIG` (the
 *   string namespace consumed by `registerAs<IBrandModuleOptions>(
 *   BRAND_CONFIG, () => ({ metadata: {...} }))`); runtime tenant
 *   overrides flow through `BrandService.applyPayload(payload)`.
 *
 *   Sibling: `theming.tokens.ts` — same pattern for the theming
 *   subsystem.
 *
 *   Every consumer of the brand runtime imports these tokens:
 *
 *   - `BRAND_CONFIG`   — merged `IBrandModuleOptions`.
 *   - `BRAND_BINDINGS` — platform adapter (DOM / native).
 *   - `BRAND_SERVICE`  — client orchestrator.
 */

/**
 * Token for the merged `IBrandModuleOptions`.
 *
 * Doubles as the string namespace `registerAs<IBrandModuleOptions>(
 * BRAND_CONFIG, () => ({...}))` publishes under. Consumers inject
 * the same token to receive the resolved config.
 */
export const BRAND_CONFIG = "brand" as const;

/**
 * Token for the runtime `IBrandBindings` implementation
 * (`WebBrandBindings` on web, `NativeBrandBindings` on RN, or
 * `NullBrandBindings` in headless / SSR contexts).
 */
export const BRAND_BINDINGS = Symbol.for("BRAND_BINDINGS");

/**
 * Token for the `BrandService` — client-only orchestrator that
 * applies `IBrandMetadata` to the platform (via bindings) at boot
 * and on runtime override.
 */
export const BRAND_SERVICE = Symbol.for("BRAND_SERVICE");
