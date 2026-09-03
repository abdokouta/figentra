/**
 * @file logger-manager.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the logger manager service.
 *   Binds `ILoggerManager` — the workspace's canonical logging surface.
 */

/** Injection token for `ILoggerManager`. */
export const LOGGER_MANAGER: unique symbol = Symbol.for("LOGGER_MANAGER");
