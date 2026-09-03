/**
 * @file compressed.serializer.ts
 * @module @stackra/nestjs-redis/serialization
 * @description Compressed serializer that applies gzip compression after
 *   serialization. Wraps another serializer (default: JSON) and compresses
 *   the output for reduced storage and network usage.
 */

import { IInjectable } from '@nestjs/common';
import { gzipSync, gunzipSync } from 'zlib';
import type { IRedisSerializer } from '@stackra/contracts';

import { JsonSerializer } from './json.serializer';

/**
 * Compressed serializer.
 *
 * Applies gzip compression after serialization. Wraps an inner serializer
 * (defaults to JSON) and compresses the output. Useful for large payloads
 * where storage/bandwidth savings outweigh the CPU cost of compression.
 *
 * The compressed output is stored as a base64 string in Redis.
 */
@IInjectable()
export class CompressedSerializer implements IRedisSerializer {
  /** The inner serializer to compress output from. */
  private readonly inner: IRedisSerializer;

  /**
   * @param inner - The serializer to wrap. Defaults to JsonSerializer.
   */
  public constructor(inner?: IRedisSerializer) {
    this.inner = inner ?? new JsonSerializer();
  }

  /**
   * Get the serializer format identifier.
   *
   * @returns `"gzip"`.
   */
  public getFormat(): string {
    return 'gzip';
  }

  /**
   * Serialize and compress a value.
   *
   * @param value - The value to serialize and compress.
   * @returns The gzip-compressed, base64-encoded string.
   */
  public serialize(value: unknown): string {
    const serialized = this.inner.serialize(value);
    const input = typeof serialized === 'string' ? Buffer.from(serialized, 'utf-8') : serialized;
    const compressed = gzipSync(input);
    return compressed.toString('base64');
  }

  /**
   * Decompress and deserialize a value.
   *
   * @param raw - The base64-encoded, gzip-compressed string from Redis.
   * @returns The deserialized value.
   * @throws When decompression or deserialization fails.
   */
  public deserialize(raw: string | Buffer): unknown {
    const buffer = typeof raw === 'string' ? Buffer.from(raw, 'base64') : raw;
    const decompressed = gunzipSync(buffer);
    return this.inner.deserialize(decompressed.toString('utf-8'));
  }
}
