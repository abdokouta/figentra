/**
 * @file state-transition.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IStateTransition interface.
 */

/** A single state transition event. */
export interface IStateTransition {
  /** The entity being transitioned. */
  entity: unknown;
  /** Field name that changed. */
  field: string;
  /** Previous state value. */
  from: string;
  /** New state value. */
  to: string;
  /** Optional reason/metadata for the transition. */
  metadata?: Record<string, unknown>;
}
