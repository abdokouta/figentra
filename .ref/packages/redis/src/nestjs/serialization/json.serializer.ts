/**
 * @file json.serializer.ts
 * @module @stackra/nestjs-redis/serialization
 * @description JSON serializer — the default serialization format.
 *   Handles safe serialization and deserialization with type preservation.
 */

import { IInjectable } from '@nestjs/common';
import type { IRedisSerializer } from '@stackra/contracts';

/**
 * JSON serializer.
 *
 * Default serialization format for Redis values. Handles all JSON-safe
 * types (strings, numbers, booleans, arrays, objects, null).
 */
@IInjectable()
export class JsonSerializer implements IRedisSerializer {
  /**
   * Get the serializer format identifier.
   *
   * @returns `"json"`.
   */
  public getFormat(): string {
    return 'json';
  }

  /**
   * Serialize a value to a JSON string.
   *
   * @param value - The value to serialize.
   * @returns The JSON string representation.
   */
  public serialize(value: unknown): string {
    return JSON.stringify(value);
  }

  /**
   * Deserialize a JSON string back to its original form.
   *
   * @param raw - The raw string from Redis.
   * @returns The deserialized value.
   * @throws When the string is not valid JSON.
   */
  public deserialize(raw: string | Buffer): unknown {
    const str = typeof raw === 'string' ? raw : raw.toString('utf-8');
    return JSON.parse(str);
  }
}
