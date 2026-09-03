/**
 * @file secrets-driver.decorator.ts
 * @module @stackra/config/nestjs/decorators
 * @description Decorator to mark a class as a secrets driver for auto-discovery.
 */

import { SECRETS_DRIVER_METADATA_KEY } from '../services/secrets-driver-loader.service';

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Mark a class as a secrets driver for auto-discovery.
 *
 * The `SecretsDriverLoader` uses NestJS DiscoveryService to find all
 * providers decorated with `@SecretsDriver(name)` and registers them
 * as available secrets drivers.
 *
 * @param name - The driver name (e.g., 'doppler', 'vault', 'ssm')
 * @returns A class decorator
 *
 * @example
 * ```typescript
 * @SecretsDriver('doppler')
 * @Injectable()
 * export class DopplerSecretsDriver implements ISecretsDriver {
 *   async get(key: string) { ... }
 *   async getAll() { ... }
 *   async refresh() { ... }
 *   async has(key: string) { ... }
 * }
 * ```
 */
export function SecretsDriver(name: string): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(SECRETS_DRIVER_METADATA_KEY, name, target);
  };
}
