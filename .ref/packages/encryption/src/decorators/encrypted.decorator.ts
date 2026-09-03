/**
 * @file encrypted.decorator.ts
 * @module @stackra/nestjs-encryption/decorators
 * @description Property decorator that marks a field for automatic encryption/decryption.
 *   Stores metadata for ORM integration — encrypt on persist, decrypt on hydrate.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/** Metadata key for encrypted field markers. */
export const ENCRYPTED_METADATA_KEY = 'stackra:encryption:encrypted_fields';

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Property decorator that marks a field for automatic encryption/decryption.
 *
 * When applied to an entity property, the ORM integration layer will:
 * - Encrypt the field value before persisting to the database
 * - Decrypt the field value after hydrating from the database
 *
 * Metadata is stored on the class constructor for runtime discovery.
 *
 * @returns Property decorator
 *
 * @example
 * ```typescript
 * class User {
 *   @Encrypted()
 *   ssn!: string;
 *
 *   @Encrypted()
 *   creditCard!: string;
 * }
 * ```
 */
export function Encrypted(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const constructor = target.constructor;
    const existing = getMetadata<string[]>(ENCRYPTED_METADATA_KEY, constructor) ?? [];
    const fieldName = String(propertyKey);

    if (!existing.includes(fieldName)) {
      defineMetadata(ENCRYPTED_METADATA_KEY, [...existing, fieldName], constructor);
    }
  };
}

/**
 * Get the list of encrypted fields for a class.
 *
 * @param target - The class constructor to inspect
 * @returns Array of property names marked with @Encrypted()
 */
export function getEncryptedFields(target: Function): string[] {
  return getMetadata<string[]>(ENCRYPTED_METADATA_KEY, target) ?? [];
}
