/**
 * @file state.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the reactive state subsystem.
 */

/** Token for the `StateRegistry` — the index of all DI-managed reactive stores. */
export const STATE_REGISTRY = Symbol.for("STATE_REGISTRY");
