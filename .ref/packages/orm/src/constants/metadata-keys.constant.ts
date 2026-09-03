/**
 * @file metadata-keys.constant.ts
 * @description Defines Symbol-based metadata keys used by the ORM decorators
 * to store entity, property, and trait information on class constructors/prototypes.
 */

/** Stores entity-level options on the class constructor. */
export const ENTITY_METADATA = Symbol('orm:entity');

/** Stores property definitions on the class prototype. */
export const PROPERTY_METADATA = Symbol('orm:properties');

/** Stores applied trait names on the class prototype. */
export const TRAIT_METADATA = Symbol('orm:traits');
