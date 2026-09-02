/**
 * @file container-config.token.ts
 * @module @stackra/contracts/tokens
 * @description Configuration namespace for the container's
 *   `ApplicationFactory` bootstrap options.
 *
 *   Distinct from {@link APPLICATION_CONFIG} (`"application"`), which
 *   configures the running application context (Fastify server,
 *   validation pipe, shutdown, ...).  `CONTAINER_CONFIG` targets the
 *   DI-container-only bootstrap knobs — debug flag, global name,
 *   resolution logging.
 */

/**
 * String constant used both as the `registerAs(CONTAINER_CONFIG, ...)`
 * namespace on the app-side config factory AND as the DI token the
 * container binds the resolved bootstrap options under. The value IS
 * the namespace string — consumers can spell either the constant or
 * the literal `"container"` and reach the same registration.
 */
export const CONTAINER_CONFIG = "container" as const;
