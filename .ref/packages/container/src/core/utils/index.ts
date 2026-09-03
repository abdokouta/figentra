/**
 * @file index.ts
 * @module utils
 * @description Utilities Barrel Export
 *
 *   Helper functions for working with the DI system.
 *
 *   - {@link forwardRef} — Wraps a class reference in a lazy function to break circular dependencies
 *   - {@link defineConfig} — Type-safe helper for `ApplicationFactory.create()` options
 *   - {@link generateMetadataKey} — Mint a unique key for `DiscoveryService.createDecorator()`
 *   - {@link tokenName} — Convert any injection token to a human-readable string
 *
 *   The `registerWith` helper was removed as part of the ADR-0052
 *   §Registrar-class rollout — `forFeature` seeding now uses
 *   inline `@Injectable()` registrar classes implementing
 *   `OnApplicationBootstrap` (see `.kiro/steering/module-lifecycle.md`).
 */

export { forwardRef } from "@/core/utils/forward-ref.util";
// `defineConfig` (deprecated) removed with its implementation file — consumers
// use `registerAs` from `@stackra/config` per ADR-0063.
export { generateMetadataKey } from "@/core/utils/generate-metadata-key.util";
export { tokenName } from "@/core/utils/token-name.util";
export { isCustomProvider } from "@/core/utils/is-custom-provider.util";
export { isClassShorthand } from "@/core/utils/is-class-shorthand.util";
export { isClassProvider } from "@/core/utils/is-class-provider.util";
export { isValueProvider } from "@/core/utils/is-value-provider.util";
export { isFactoryProvider } from "@/core/utils/is-factory-provider.util";
export { isExistingProvider } from "@/core/utils/is-existing-provider.util";
export { hasOnModuleInit } from "@/core/utils/has-on-module-init.util";
export { hasOnModuleDestroy } from "@/core/utils/has-on-module-destroy.util";
export * from "@/core/utils/global-application.util";
export * from "@/core/utils/inject.util";
