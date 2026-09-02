/**
 * @file application.token.ts
 * @module @stackra/contracts/tokens
 * @description Token for the bootstrapped application context (IApplication)
 *   AND the config namespace `@stackra/container`'s
 *   `application.config.ts` template uses.
 */

/** Token for the bootstrapped `IApplication` context. */
export const APPLICATION = Symbol.for("APPLICATION");

/**
 * Configuration namespace for the container's application context.
 *
 * String constant used both as the `registerAs(APPLICATION_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token that
 * `ContainerModule` binds the resolved config under. The value IS the
 * namespace string — consumers can spell either the constant or the
 * literal `"application"` and reach the same registration.
 *
 * Distinct from {@link APP_CONFIG} (`"app"`), which is the top-level
 * app-level configuration namespace exported from `app-config.token.ts`.
 */
export const APPLICATION_CONFIG = "application" as const;
