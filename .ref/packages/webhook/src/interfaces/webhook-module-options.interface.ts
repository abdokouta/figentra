/**
 * @file webhook-module-options.interface.ts
 * @module @stackra/webhook/src/interfaces
 * @description IWebhookModuleOptions interface.
 */

/**
 * Configuration for {@link NestWebhookModule}.
 *
 * Extend with NestJS-specific options. Core options pass through to the
 * underlying `@stackra/ts-webhook` module.
 */
export interface IWebhookModuleOptions {
  // TODO: Add module options as the public API stabilizes.
}
