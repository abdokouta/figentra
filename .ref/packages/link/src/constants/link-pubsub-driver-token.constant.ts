/**
 * @file link-pubsub-driver-token.constant.ts
 * @module @stackra/nestjs-link/constants
 * @description DI token for the PubSub driver used by LinkModuleService.
 */

/**
 * DI token for the PubSub driver used by `LinkModuleService` to publish events.
 *
 * This is an *internal* alias — `LinkModule.forRoot()` resolves the actual
 * PubSub driver (from `@stackra/nestjs-pubsub`) and registers it under this token
 * so that all `LinkModuleService` instances can inject it without knowing
 * which connection name was used.
 *
 * The default connection token from `@stackra/contracts` is
 * `PUBSUB_SERVICE` — pass any other token to use a named connection.
 */
export const LINK_PUBSUB_DRIVER_TOKEN = 'LINK_PUBSUB_DRIVER';
