/**
 * @file serialize.util.ts
 * @module @stackra/ts-redis/utils
 * @description JSON serialization utilities for Redis values.
 *   Handles safe serialization and deserialization with type preservation.
 */

/**
 * Serialize a value to a JSON string for Redis storage.
 *
 * @param value - The value to serialize.
 * @returns The JSON string representation.
 */
export function serializeValue(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Deserialize a JSON string from Redis back to its original form.
 *
 * Falls back to returning the raw string if JSON parsing fails
 * (the value may have been stored as a plain string).
 *
 * @param raw - The raw string from Redis.
 * @returns The deserialized value, or the raw string on parse failure.
 */
export function deserializeValue(raw: string | null): unknown {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
