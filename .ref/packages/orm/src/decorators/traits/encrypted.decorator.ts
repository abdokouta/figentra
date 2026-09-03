/**
 * @file encrypted.decorator.ts
 * @module @stackra/nestjs-orm/decorators/traits
 * @description @Encrypted() trait — auto-encrypts/decrypts specified fields at rest.
 *
 *   Listed fields are encrypted before insert/update and decrypted after load.
 *   Uses the encryption service from @stackra/nestjs-encryption.
 *   No additional columns — same column stores the encrypted value.
 */

import { defineMetadata } from '@vivtel/metadata';
import { addTrait } from '../../utils/add-trait.util';

// ============================================================================
// Constants
// ============================================================================

/** Metadata key for @Encrypted() trait. */
export const ENCRYPTED_METADATA_KEY = 'stackra:orm:encrypted';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Decorator
// ============================================================================

/**
 * Auto-encrypt/decrypt specified entity fields at rest.
 *
 * Before insert/update: listed fields are encrypted using the configured
 * encryption key (from `@stackra/nestjs-encryption`).
 * After load: fields are decrypted transparently.
 *
 * No additional columns needed — the same column stores the ciphertext.
 * Column type should be `text` (ciphertext is longer than plaintext).
 *
 * @param config - Encryption configuration
 * @returns Class decorator
 *
 * @example
 * ```typescript
 * @Entity({ tableName: 'users' })
 * @Timestamps()
 * @Encrypted({ fields: ['email', 'phone', 'ssn'] })
 * export class User extends BaseEntity {
 *   @Property({ type: 'text' })
 *   email!: string;  // stored encrypted, returned decrypted
 *
 *   @Property({ type: 'text', nullable: true })
 *   phone?: string;  // stored encrypted, returned decrypted
 *
 *   @Property({ type: 'text', nullable: true })
 *   ssn?: string;    // stored encrypted, returned decrypted
 * }
 * ```
 */
export function Encrypted(config: IEncryptedConfig): ClassDecorator {
  return (target: Function) => {
    const resolvedConfig: Required<IEncryptedConfig> = {
      fields: config.fields,
      lazy: config.lazy ?? false,
    };

    defineMetadata(ENCRYPTED_METADATA_KEY, resolvedConfig, target);
    addTrait(target.prototype, 'encrypted');
  };
}
