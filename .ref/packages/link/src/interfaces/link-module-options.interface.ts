/**
 * @file link-module-options.interface.ts
 * @module @stackra/nestjs-link/interfaces
 * @description Options for `LinkModule.forRoot()` — global configuration.
 *
 * Controls how the link system behaves at the application level:
 * - Whether it's registered as a global module
 * - Whether events are published via `@stackra/nestjs-pubsub` on link operations
 * - Which PubSub connection to use for event publishing
 * - ID generation prefix for pivot records
 *
 * ## PubSub Integration
 *
 * The link module integrates with `@stackra/nestjs-pubsub` through the
 * `@stackra/contracts` interfaces — there's no hard dependency on
 * `@stackra/nestjs-pubsub` itself.
 *
 * **Default behavior** (when `@stackra/nestjs-pubsub` is configured in your app):
 * Events are automatically published to the default PubSub connection
 * on every attach, detach, sync, or restore operation.
 *
 * ```typescript
 * LinkModule.forRoot()  // emits to default connection
 * ```
 *
 * **Custom connection:**
 * ```typescript
 * import { getPubSubToken } from '@stackra/contracts';
 *
 * LinkModule.forRoot({
 *   pubsubToken: getPubSubToken('events'), // use a named connection
 * })
 * ```
 *
 * **Disable events:**
 * ```typescript
 * LinkModule.forRoot({ emitEvents: false })
 * ```
 *
 * ## Event Channels
 * Events are published to channels named: `link.<linkName>.<action>`
 * - `link.RolePermission.attached`
 * - `link.RolePermission.detached`
 * - `link.RolePermission.synced`
 * - `link.RolePermission.restored`
 */

/**
 * Global options for the link module (passed to `LinkModule.forRoot()`).
 */
export interface ILinkModuleOptions {
  /**
   * Whether to register `LinkModule` as a global NestJS module.
   * When true, the `LinkRegistry` and shared services are available
   * everywhere without re-importing.
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Whether to publish events on link operations (attach, detach, sync, restore).
   *
   * - `true` (default) — publishes to `pubsubToken` (or the default connection from `@stackra/contracts`)
   * - `false` — disables event publishing entirely (no pubsub wiring)
   *
   * If `pubsubToken` is provided, this option is ignored (events are always
   * enabled when a token is explicitly set).
   *
   * @default true
   */
  emitEvents?: boolean;

  /**
   * Custom DI token for the PubSub driver to use for event publishing.
   *
   * Use `getPubSubToken('connectionName')` from `@stackra/contracts` to target
   * a named connection. When omitted, the default connection token
   * (`PUBSUB_DEFAULT_CONNECTION`) is used.
   *
   * @example
   * ```typescript
   * import { getPubSubToken } from '@stackra/contracts';
   *
   * LinkModule.forRoot({ pubsubToken: getPubSubToken('events') })
   * ```
   */
  pubsubToken?: string | symbol;

  /**
   * Default ID prefix for pivot record IDs.
   * Each link can override this in its own options.
   * @default 'link'
   */
  idPrefix?: string;
}
