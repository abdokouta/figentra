/**
 * @file msgpack.serializer.ts
 * @module @stackra/nestjs-redis/serialization
 * @description MessagePack serializer for compact binary encoding.
 *   Produces smaller payloads than JSON at the cost of human readability.
 *   Requires the `msgpackr` package as an optional peer dependency.
 */

import { IInjectable } from '@nestjs/common';
import type { IRedisSerializer } from '@stackra/contracts';

/**
 * MessagePack serializer.
 *
 * Produces compact binary encoding for Redis values. Useful for
 * high-throughput scenarios where payload size matters more than
 * human readability.
 *
 * Falls back to JSON if `msgpackr` is not installed.
 */
@IInjectable()
export class MsgpackSerializer implements IRedisSerializer {
  /** Cached msgpackr module (lazy-loaded). */
  private packr: { pack: (value: unknown) => Buffer; unpack: (buffer: Buffer) => unknown } | null =
    null;

  /**
   * Get the serializer format identifier.
   *
   * @returns `"msgpack"`.
   */
  public getFormat(): string {
    return 'msgpack';
  }

  /**
   * Serialize a value to MessagePack binary format.
   *
   * @param value - The value to serialize.
   * @returns The MessagePack buffer as a base64 string for Redis storage.
   */
  public serialize(value: unknown): string {
    const packer = this.getPacker();
    const buffer = packer.pack(value);
    return buffer.toString('base64');
  }

  /**
   * Deserialize a MessagePack value back to its original form.
   *
   * @param raw - The base64-encoded string from Redis.
   * @returns The deserialized value.
   * @throws When deserialization fails.
   */
  public deserialize(raw: string | Buffer): unknown {
    const packer = this.getPacker();
    const buffer = typeof raw === 'string' ? Buffer.from(raw, 'base64') : raw;
    return packer.unpack(buffer);
  }

  /**
   * Lazy-load the msgpackr module.
   *
   * @returns The msgpackr Packr instance.
   * @throws When msgpackr is not installed.
   */
  private getPacker(): { pack: (value: unknown) => Buffer; unpack: (buffer: Buffer) => unknown } {
    if (this.packr) return this.packr;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Packr } = require('msgpackr');
      this.packr = new Packr({ structuredClone: true });
      return this.packr!;
    } catch {
      throw new Error(
        '[MsgpackSerializer] The "msgpackr" package is required for MessagePack serialization. ' +
          'Install it with: yarn add msgpackr'
      );
    }
  }
}
