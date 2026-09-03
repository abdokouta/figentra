/**
 * @file i18n-store.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description II18nStore interface.
 */

import type { II18nState } from "./i18n-state.interface";

/**
 * Minimal store interface matching `@stackra/react-state`'s `Store`
 * API.
 *
 * Isolates the i18n service from a hard dependency on the full state
 * package — any object implementing `getState` + `setState` satisfies
 * the contract (TanStack Store, a custom Redux-shaped bridge, an
 * in-memory test double, ...).
 */
export interface II18nStore {
  /** Get the current state snapshot. */
  getState(): II18nState;
  /** Update state with a partial update or updater function. */
  setState(
    updater: Partial<II18nState> | ((prev: II18nState) => II18nState),
  ): void;
}
