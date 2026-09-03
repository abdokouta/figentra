/**
 * @file link-registry-token.constant.ts
 * @module @stackra/nestjs-link/constants
 * @description DI token for the global LinkRegistry instance.
 */

/**
 * DI token for the global LinkRegistry instance.
 * The registry holds metadata for all registered links at runtime.
 */
export const LINK_REGISTRY_TOKEN = Symbol('LINK_REGISTRY');
