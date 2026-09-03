/**
 * @file serializer-registry.service.ts
 * @module @stackra/nestjs-redis/serialization
 * @description Registry for named serializers. Allows configuring different
 *   serialization strategies per use case (e.g., JSON for cache, msgpack for
 *   sessions, compressed for large payloads).
 */

import { IInjectable } from '@nestjs/common';
import { BaseRegistry } from '@stackra/ts-support';
import { Logger } from '@stackra/logger';
import type { IRedisSerializer } from '@stackra/contracts';

import { JsonSerializer } from './json.serializer';

/**
 * Serializer registry.
 *
 * Manages named serializers for different use cases. The default
 * serializer is JSON. Additional serializers can be registered by
 * name and retrieved when needed.
 *
 * Extends `BaseRegistry<string, IRedisSerializer>` where the key is
 * the serializer name.
 */
@IInjectable()
export class SerializerRegistry extends BaseRegistry<string, IRedisSerializer> {
  /** Scoped logger. */
  private readonly logger = new Logger(SerializerRegistry.name);

  /** Default serializer (JSON). */
  private readonly defaultSerializer: IRedisSerializer;

  public constructor() {
    super();
    this.defaultSerializer = new JsonSerializer();
    this.register('json', this.defaultSerializer);
  }

  /**
   * Register a named serializer.
   *
   * @param name - The serializer name.
   * @param serializer - The serializer instance.
   * @returns this (for chaining)
   */
  public override register(name: string, serializer: IRedisSerializer): this {
    super.register(name, serializer);
    this.logger.info(
      `[SerializerRegistry] Registered serializer "${name}" (format: ${serializer.getFormat()}).`
    );
    return this;
  }

  /**
   * Get a serializer by name.
   *
   * @param name - The serializer name. Returns default (JSON) if not found.
   * @returns The serializer instance.
   */
  public override get(name?: string): IRedisSerializer {
    if (!name) return this.defaultSerializer;
    return super.get(name) ?? this.defaultSerializer;
  }

  /**
   * List all registered serializer names.
   *
   * @returns Array of serializer names.
   */
  public getNames(): string[] {
    return this.keys();
  }
}
