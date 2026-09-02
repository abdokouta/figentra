/**
 * @file notifications.tokens.ts
 * @module @stackra/contracts/tokens
 * @description Cross-package DI namespace tokens for the
 *   notifications subsystem. Lives in contracts (not
 *   `@stackra/notifications`) so cross-package consumers can inject
 *   the config value without pulling in the notifications runtime.
 */

/**
 * Namespace under which the notifications module registers its
 * `IConfigFactory` — the string constant
 * `"notifications"`. Services `@Inject(NOTIFICATIONS_CONFIG)` receive
 * the merged `INotificationModuleOptions`.
 */
export const NOTIFICATIONS_CONFIG = "notifications" as const;

/**
 * DI token for the reactive store backing the
 * `InAppNotificationCentre`. Registered via
 * `StateModule.forFeature<IInAppNotificationCentreState>(...)` from
 * `NotificationModule.forRoot`. Consumers who need a raw
 * `Store<IInAppNotificationCentreState>` (bypassing the centre's
 * write API) inject this token; React consumers use
 * `useStore(IN_APP_NOTIFICATION_STORE, selector)` from
 * `@stackra/state/react`.
 */
export const IN_APP_NOTIFICATION_STORE = Symbol.for(
  "IN_APP_NOTIFICATION_STORE",
);
