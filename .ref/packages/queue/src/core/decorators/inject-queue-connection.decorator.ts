/**
 * @file inject-queue-connection.decorator.ts
 * @module @stackra/queue/core/decorators
 * @description Parameter decorator for injecting a queue connection by name.
 */

import { Inject } from '@stackra/ts-container';
import { getQueueConnectionToken } from '../utils/token-builders.util';

/**
 * Inject a queue connection by name.
 *
 * @param name - Connection name (defaults to the module default)
 * @returns A parameter decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class SyncService {
 *   constructor(@InjectQueueConnection('redis') private readonly conn: IQueueConnection) {}
 * }
 * ```
 */
export function InjectQueueConnection(name?: string): ParameterDecorator {
  return Inject(getQueueConnectionToken(name));
}
