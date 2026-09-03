/**
 * @file define-state.util.ts
 * @module @stackra/nestjs-orm/state-machine
 * @description Utility for defining state machine configurations.
 */

import type { IStateConfig } from './state-machine.interfaces';

/**
 * Define a state machine configuration for an entity field.
 * Used with the @Stateable() decorator.
 *
 * @param config - State machine configuration
 * @returns The validated config (identity pass-through with validation)
 *
 * @example
 * ```typescript
 * export const VenueStatusState = defineState({
 *   name: 'venue_status',
 *   field: 'status',
 *   enum: VenueStatus,
 *   default: VenueStatus.ACTIVE,
 *   transitions: {
 *     [VenueStatus.ACTIVE]: [VenueStatus.INACTIVE, VenueStatus.TEMPORARILY_CLOSED],
 *     [VenueStatus.INACTIVE]: [VenueStatus.ACTIVE],
 *   },
 * });
 * ```
 */
export function defineState(config: IStateConfig): IStateConfig {
  // Validate that default state exists in enum values
  const enumValues = Object.values(config.enum);
  if (!enumValues.includes(config.default)) {
    throw new Error(
      `[defineState] Default "${config.default}" is not a valid enum value for "${config.name}"`
    );
  }

  // Validate that all transition keys are valid enum values
  for (const from of Object.keys(config.transitions)) {
    if (!enumValues.includes(from)) {
      throw new Error(
        `[defineState] Transition source "${from}" is not a valid enum value for "${config.name}"`
      );
    }
    for (const to of config.transitions[from]!) {
      if (!enumValues.includes(to)) {
        throw new Error(
          `[defineState] Transition target "${to}" is not a valid enum value for "${config.name}"`
        );
      }
    }
  }

  return config;
}
