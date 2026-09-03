/**
 * @file tag-manager.service.ts
 * @module @stackra/ts-redis/tags
 * @description Tag-based cache invalidation manager. Associates cache keys
 *   with tags stored as Redis sets and supports bulk invalidation by tag name.
 */

import { IInjectable, Inject } from '@stackra/ts-container';
import { Logger } from '@stackra/logger';

import type { IRedisManager, IRedisTagManager, IRedisModuleOptions } from '@stackra/contracts';
import { REDIS_CONFIG, REDIS_MANAGER } from '@stackra/contracts';

import { DEFAULT_TAG_PREFIX } from '../constants';

/**
 * Tag manager for cache invalidation by group.
 *
 * Tags are stored as Redis sets where each set contains the cache keys
 * associated with that tag. Flushing a tag deletes all associated keys
 * and removes the tag set itself.
 *
 * Handles stale references gracefully — keys that have expired via TTL
 * are skipped during flush without error.
 */
@IInjectable()
export class TagManager implements IRedisTagManager {
  /** Scoped logger. */
  private readonly logger = new Logger(TagManager.name);

  /** Key prefix for tag sets. */
  private readonly prefix: string;

  /** Connection name for tag operations. */
  private readonly connectionName?: string;

  /**
   * @param manager - Redis manager for client access.
   * @param config - Module configuration for tag prefix and connection.
   */
  public constructor(
    @Inject(REDIS_MANAGER) private readonly manager: IRedisManager,
    @Inject(REDIS_CONFIG) private readonly config: IRedisModuleOptions
  ) {
    this.prefix = config.tags?.prefix ?? DEFAULT_TAG_PREFIX;
    this.connectionName = config.tags?.connection;
  }

  /**
   * Associate a cache key with one or more tags.
   *
   * @param key - The cache key to tag.
   * @param tags - One or more tag names.
   */
  public async tag(key: string, tags: string[]): Promise<void> {
    if (tags.length === 0) return;

    const client = await this.manager.connection(this.connectionName);
    const pipe = client.pipeline();

    for (const tagName of tags) {
      pipe.sadd(this.tagKey(tagName), key);
    }

    await pipe.exec();
  }

  /**
   * Flush all keys associated with a single tag.
   *
   * @param tag - The tag name.
   * @returns Count of keys deleted.
   */
  public async flushTag(tag: string): Promise<number> {
    const client = await this.manager.connection(this.connectionName);
    const tagSetKey = this.tagKey(tag);

    const members = await client.smembers(tagSetKey);
    if (members.length === 0) {
      await client.del(tagSetKey);
      return 0;
    }

    // Delete all tagged keys + the tag set itself
    const pipe = client.pipeline();
    let count = 0;

    for (const key of members) {
      pipe.del(key);
      count++;
    }
    pipe.del(tagSetKey);

    await pipe.exec();

    this.logger.info(`[TagManager] Flushed tag "${tag}": ${count} keys.`);
    return count;
  }

  /**
   * Flush all keys associated with multiple tags.
   *
   * @param tags - Array of tag names.
   * @returns Total count of keys deleted.
   */
  public async flushTags(tags: string[]): Promise<number> {
    if (tags.length === 0) return 0;

    let total = 0;
    for (const tag of tags) {
      total += await this.flushTag(tag);
    }
    return total;
  }

  /**
   * Get all keys associated with a tag.
   *
   * @param tag - The tag name.
   * @returns Array of cache keys.
   */
  public async getTaggedKeys(tag: string): Promise<string[]> {
    const client = await this.manager.connection(this.connectionName);
    return client.smembers(this.tagKey(tag));
  }

  /**
   * Remove a key from all its associated tags.
   *
   * This is a best-effort operation — it scans all tag sets for the key.
   * For high-performance scenarios, maintain a reverse index.
   *
   * @param key - The cache key to untag.
   */
  public async untag(key: string): Promise<void> {
    const client = await this.manager.connection(this.connectionName);

    // Scan for tag sets containing this key
    let cursor = 0;
    do {
      const [next, keys] = await client.scan(cursor, { match: `${this.prefix}*`, count: 100 });
      cursor = next;

      if (keys.length > 0) {
        const pipe = client.pipeline();
        for (const tagSetKey of keys) {
          pipe.srem(tagSetKey, key);
        }
        await pipe.exec();
      }
    } while (cursor !== 0);
  }

  /**
   * Build the Redis key for a tag set.
   *
   * @param tag - The tag name.
   * @returns The full Redis key (e.g., "tag:products").
   */
  private tagKey(tag: string): string {
    return `${this.prefix}${tag}`;
  }
}
