/**
 * @file transition-result.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description ITransitionResult interface.
 */

/** Result of a transition attempt. */
export interface ITransitionResult {
  /** Whether the transition succeeded. */
  success: boolean;
  /** The entity after transition (or unchanged if failed). */
  entity: unknown;
  /** Error message if transition was invalid. */
  error?: string;
  /** The transition that was applied (if successful). */
  transition?: IStateTransition;
}
