/**
 * @file state-config.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description IStateConfig interface.
 */

/** Configuration for a state field on an entity. */
export interface IStateConfig {
  /** Unique name for this state machine (e.g., 'venue_status'). */
  name: string;
  /** The entity field this state machine manages (e.g., 'status'). */
  field: string;
  /** The enum type for valid states. */
  enum: Record<string, string>;
  /** Default state for new entities. */
  default: string;
  /** Allowed transitions: { [fromState]: [toState1, toState2, ...] } */
  transitions: Record<string, string[]>;
}
