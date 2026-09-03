/**
 * @file upstash.client.ts
 * @module @stackra/ts-redis/backends/upstash
 * @description Upstash HTTP-backed Redis client implementing the full
 *   `IRedisClient` interface. Operations issue HTTPS requests under the
 *   hood, making the client safe for browsers, edge runtimes, and React Native.
 */

import type { Redis } from '@upstash/redis';
import type {
  IRedisClient,
  IRedisPipeline,
  IRedisSubscriber,
  IRedisTransaction,
  ISetOptions,
  RedisPipelineResult,
} from '@stackra/contracts';

/**
 * Upstash REST client implementation.
 *
 * Wraps the `@upstash/redis` SDK to satisfy `IRedisClient`. Notable
 * behaviors specific to the HTTP transport:
 * - `disconnect()` is a no-op — there is no socket to close.
 * - Pipelines batch commands into a single HTTP request.
 * - Transactions use the Upstash multi-exec HTTP endpoint.
 */
export class UpstashClient implements IRedisClient {
  /**
   * @param redis - Upstash SDK client instance.
   * @param name - Logical connection name for events and diagnostics.
   */
  public constructor(
    private readonly redis: Redis,
    private readonly name: string
  ) {}

  // ──────────────────────────────────────────────────────────────────
  // Identity
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public getName(): string {
    return this.name;
  }

  // ──────────────────────────────────────────────────────────────────
  // String Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async get(key: string): Promise<string | null> {
    const value = await this.redis.get<string>(key);
    return value ?? null;
  }

  /** @inheritdoc */
  public async set(key: string, value: string, options?: ISetOptions): Promise<'OK' | null> {
    if (options?.ex) {
      const result = await this.redis.setex(key, options.ex, value);
      return result as 'OK';
    }
    if (options?.px) {
      const result = await this.redis.psetex(key, options.px, value);
      return result as 'OK';
    }
    if (options?.nx) {
      const result = await this.redis.setnx(key, value);
      return result ? 'OK' : null;
    }
    if (options?.xx) {
      const exists = await this.redis.exists(key);
      if (!exists) return null;
    }
    const result = await this.redis.set(key, value);
    return result as 'OK';
  }

  /** @inheritdoc */
  public async mget(...keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    const values = await this.redis.mget<string[]>(...keys);
    return values.map((v) => (v === undefined ? null : v));
  }

  /** @inheritdoc */
  public async mset(data: Record<string, string>): Promise<'OK'> {
    return this.redis.mset(data) as Promise<'OK'>;
  }

  /** @inheritdoc */
  public async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  /** @inheritdoc */
  public async incrby(key: string, increment: number): Promise<number> {
    return this.redis.incrby(key, increment);
  }

  /** @inheritdoc */
  public async decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  /** @inheritdoc */
  public async decrby(key: string, decrement: number): Promise<number> {
    return this.redis.decrby(key, decrement);
  }

  /** @inheritdoc */
  public async append(key: string, value: string): Promise<number> {
    return this.redis.append(key, value);
  }

  /** @inheritdoc */
  public async getrange(key: string, start: number, end: number): Promise<string> {
    return this.redis.getrange(key, start, end);
  }

  // ──────────────────────────────────────────────────────────────────
  // Hash Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async hget(key: string, field: string): Promise<string | null> {
    const value = await this.redis.hget<string>(key, field);
    return value ?? null;
  }

  /** @inheritdoc */
  public async hset(key: string, field: string, value: string): Promise<number> {
    return this.redis.hset(key, { [field]: value });
  }

  /** @inheritdoc */
  public async hdel(key: string, ...fields: string[]): Promise<number> {
    if (fields.length === 0) return 0;
    return this.redis.hdel(key, ...fields);
  }

  /** @inheritdoc */
  public async hgetall(key: string): Promise<Record<string, string>> {
    const result = await this.redis.hgetall<Record<string, string>>(key);
    return result ?? {};
  }

  /** @inheritdoc */
  public async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
    if (fields.length === 0) return [];
    const result = await this.redis.hmget<Record<string, string | null>>(key, ...fields);
    return fields.map((f) => result?.[f] ?? null);
  }

  /** @inheritdoc */
  public async hmset(key: string, data: Record<string, string>): Promise<'OK'> {
    await this.redis.hset(key, data);
    return 'OK';
  }

  /** @inheritdoc */
  public async hincrby(key: string, field: string, increment: number): Promise<number> {
    return this.redis.hincrby(key, field, increment);
  }

  /** @inheritdoc */
  public async hexists(key: string, field: string): Promise<number> {
    return this.redis.hexists(key, field);
  }

  /** @inheritdoc */
  public async hkeys(key: string): Promise<string[]> {
    return this.redis.hkeys(key);
  }

  /** @inheritdoc */
  public async hvals(key: string): Promise<string[]> {
    return this.redis.hvals(key);
  }

  /** @inheritdoc */
  public async hlen(key: string): Promise<number> {
    return this.redis.hlen(key);
  }

  // ──────────────────────────────────────────────────────────────────
  // List Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async lpush(key: string, ...values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    return this.redis.lpush(key, ...values);
  }

  /** @inheritdoc */
  public async rpush(key: string, ...values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    return this.redis.rpush(key, ...values);
  }

  /** @inheritdoc */
  public async lpop(key: string): Promise<string | null> {
    const value = await this.redis.lpop<string>(key);
    return value ?? null;
  }

  /** @inheritdoc */
  public async rpop(key: string): Promise<string | null> {
    const value = await this.redis.rpop<string>(key);
    return value ?? null;
  }

  /** @inheritdoc */
  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.lrange<string>(key, start, stop);
  }

  /** @inheritdoc */
  public async llen(key: string): Promise<number> {
    return this.redis.llen(key);
  }

  /** @inheritdoc */
  public async lrem(key: string, count: number, value: string): Promise<number> {
    return this.redis.lrem(key, count, value);
  }

  /** @inheritdoc */
  public async lindex(key: string, index: number): Promise<string | null> {
    const value = await this.redis.lindex(key, index);
    return (value as string) ?? null;
  }

  /** @inheritdoc */
  public async lset(key: string, index: number, value: string): Promise<'OK'> {
    await this.redis.lset(key, index, value);
    return 'OK';
  }

  /** @inheritdoc */
  public async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    await this.redis.ltrim(key, start, stop);
    return 'OK';
  }

  // ──────────────────────────────────────────────────────────────────
  // Set Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async sadd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.redis.sadd(key, members[0]!, ...members.slice(1));
  }

  /** @inheritdoc */
  public async srem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.redis.srem(key, ...members);
  }

  /** @inheritdoc */
  public async smembers(key: string): Promise<string[]> {
    return this.redis.smembers(key) as Promise<string[]>;
  }

  /** @inheritdoc */
  public async sismember(key: string, member: string): Promise<number> {
    return this.redis.sismember(key, member);
  }

  /** @inheritdoc */
  public async scard(key: string): Promise<number> {
    return this.redis.scard(key);
  }

  /** @inheritdoc */
  public async spop(key: string, count?: number): Promise<string | string[] | null> {
    if (count !== undefined) {
      const result = await this.redis.spop(key, count);
      return result as string[] | null;
    }
    const value = await this.redis.spop(key, 1);
    return (value as string) ?? null;
  }

  /** @inheritdoc */
  public async srandmember(key: string, count?: number): Promise<string | string[] | null> {
    if (count !== undefined) {
      const result = await this.redis.srandmember(key, count);
      return result as string[] | null;
    }
    const value = await this.redis.srandmember(key);
    return (value as string) ?? null;
  }

  /** @inheritdoc */
  public async sdiff(...keys: string[]): Promise<string[]> {
    if (keys.length === 0) return [];
    const [first, ...rest] = keys;
    return this.redis.sdiff(first!, ...rest) as Promise<string[]>;
  }

  /** @inheritdoc */
  public async sinter(...keys: string[]): Promise<string[]> {
    if (keys.length === 0) return [];
    const [first, ...rest] = keys;
    return this.redis.sinter(first!, ...rest) as Promise<string[]>;
  }

  /** @inheritdoc */
  public async sunion(...keys: string[]): Promise<string[]> {
    if (keys.length === 0) return [];
    const [first, ...rest] = keys;
    return this.redis.sunion(first!, ...rest) as Promise<string[]>;
  }

  // ──────────────────────────────────────────────────────────────────
  // Sorted Set Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async zadd(key: string, score: number, member: string): Promise<number> {
    const added = await this.redis.zadd(key, { score, member });
    return added ?? 0;
  }

  /** @inheritdoc */
  public async zrem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.redis.zrem(key, ...members);
  }

  /** @inheritdoc */
  public async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zrange(key, start, stop) as Promise<string[]>;
  }

  /** @inheritdoc */
  public async zrangebyscore(
    key: string,
    min: number | string,
    max: number | string
  ): Promise<string[]> {
    // Upstash SDK uses zrange with byScore option instead of zrangebyscore
    return this.redis.zrange(key, min as number, max as number, {
      byScore: true,
    }) as Promise<string[]>;
  }

  /** @inheritdoc */
  public async zrank(key: string, member: string): Promise<number | null> {
    return this.redis.zrank(key, member);
  }

  /** @inheritdoc */
  public async zscore(key: string, member: string): Promise<string | null> {
    const score = await this.redis.zscore(key, member);
    return score !== null && score !== undefined ? String(score) : null;
  }

  /** @inheritdoc */
  public async zcard(key: string): Promise<number> {
    return this.redis.zcard(key);
  }

  /** @inheritdoc */
  public async zcount(key: string, min: number | string, max: number | string): Promise<number> {
    return this.redis.zcount(key, min, max);
  }

  /** @inheritdoc */
  public async zincrby(key: string, increment: number, member: string): Promise<string> {
    const result = await this.redis.zincrby(key, increment, member);
    return String(result);
  }

  /** @inheritdoc */
  public async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    return this.redis.zremrangebyscore(key, min, max);
  }

  /** @inheritdoc */
  public async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    return this.redis.zremrangebyrank(key, start, stop);
  }

  // ──────────────────────────────────────────────────────────────────
  // Key Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.redis.del(...keys);
  }

  /** @inheritdoc */
  public async unlink(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.redis.unlink(...keys);
  }

  /** @inheritdoc */
  public async exists(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.redis.exists(...keys);
  }

  /** @inheritdoc */
  public async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  /** @inheritdoc */
  public async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  /** @inheritdoc */
  public async pttl(key: string): Promise<number> {
    return this.redis.pttl(key);
  }

  /** @inheritdoc */
  public async persist(key: string): Promise<number> {
    return this.redis.persist(key);
  }

  /** @inheritdoc */
  public async rename(key: string, newKey: string): Promise<'OK'> {
    await this.redis.rename(key, newKey);
    return 'OK';
  }

  /** @inheritdoc */
  public async type(key: string): Promise<string> {
    return this.redis.type(key);
  }

  /** @inheritdoc */
  public async scan(
    cursor: number,
    options?: { match?: string; count?: number }
  ): Promise<[number, string[]]> {
    const result = await this.redis.scan(cursor, options ?? {});
    return [Number(result[0]), result[1] as string[]];
  }

  /** @inheritdoc */
  public async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  // ──────────────────────────────────────────────────────────────────
  // Server Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async ping(): Promise<string> {
    const result = await this.redis.ping();
    return result ?? 'PONG';
  }

  /** @inheritdoc */
  public async flushdb(): Promise<'OK'> {
    await this.redis.flushdb();
    return 'OK';
  }

  /** @inheritdoc */
  public async flushall(): Promise<'OK'> {
    await this.redis.flushall();
    return 'OK';
  }

  /** @inheritdoc */
  public async dbsize(): Promise<number> {
    return this.redis.dbsize();
  }

  /** @inheritdoc */
  public async info(_section?: string): Promise<string> {
    // Upstash SDK does not expose a direct `info` method.
    // Use the underlying JSON command to retrieve server info.
    const result = await this.redis.json.get('__upstash_info__').catch(() => null);
    if (result) return String(result);
    // Fallback: return empty string — full INFO is not available over HTTP.
    return '';
  }

  /** @inheritdoc */
  public async time(): Promise<[string, string]> {
    const result = await this.redis.time();
    return result as unknown as [string, string];
  }

  // ──────────────────────────────────────────────────────────────────
  // Lua Scripting
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    return this.redis.eval(script, keys, args);
  }

  /** @inheritdoc */
  public async evalsha(sha: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    return this.redis.evalsha(sha, keys, args);
  }

  // ──────────────────────────────────────────────────────────────────
  // Pipeline & Transaction
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public pipeline(): IRedisPipeline {
    const pipe = this.redis.pipeline();

    const wrapper: IRedisPipeline = {
      get: (key: string) => {
        pipe.get(key);
        return wrapper;
      },
      set: (key: string, value: string, options?: ISetOptions) => {
        if (options?.ex) {
          pipe.setex(key, options.ex, value);
        } else if (options?.px) {
          pipe.psetex(key, options.px, value);
        } else {
          pipe.set(key, value);
        }
        return wrapper;
      },
      incr: (key: string) => {
        pipe.incr(key);
        return wrapper;
      },
      incrby: (key: string, inc: number) => {
        pipe.incrby(key, inc);
        return wrapper;
      },
      decr: (key: string) => {
        pipe.decr(key);
        return wrapper;
      },
      decrby: (key: string, dec: number) => {
        pipe.decrby(key, dec);
        return wrapper;
      },
      hset: (key: string, field: string, value: string) => {
        pipe.hset(key, { [field]: value });
        return wrapper;
      },
      hget: (key: string, field: string) => {
        pipe.hget(key, field);
        return wrapper;
      },
      hdel: (key: string, ...fields: string[]) => {
        pipe.hdel(key, ...fields);
        return wrapper;
      },
      lpush: (key: string, ...values: string[]) => {
        pipe.lpush(key, ...values);
        return wrapper;
      },
      rpush: (key: string, ...values: string[]) => {
        pipe.rpush(key, ...values);
        return wrapper;
      },
      sadd: (key: string, ...members: string[]) => {
        if (members.length > 0) pipe.sadd(key, members[0]!, ...members.slice(1));
        return wrapper;
      },
      srem: (key: string, ...members: string[]) => {
        if (members.length > 0) pipe.srem(key, ...members);
        return wrapper;
      },
      zadd: (key: string, score: number, member: string) => {
        pipe.zadd(key, { score, member });
        return wrapper;
      },
      zrem: (key: string, ...members: string[]) => {
        pipe.zrem(key, ...members);
        return wrapper;
      },
      del: (...keys: string[]) => {
        if (keys.length > 0) pipe.del(...keys);
        return wrapper;
      },
      expire: (key: string, seconds: number) => {
        pipe.expire(key, seconds);
        return wrapper;
      },
      exec: async (): Promise<RedisPipelineResult[]> => {
        const results = (await pipe.exec()) as unknown[];
        return results.map((value) => [null, value] as RedisPipelineResult);
      },
    };

    return wrapper;
  }

  /** @inheritdoc */
  public multi(): IRedisTransaction {
    const tx = this.redis.multi();

    const wrapper: IRedisTransaction = {
      get: (key: string) => {
        tx.get(key);
        return wrapper;
      },
      set: (key: string, value: string, options?: ISetOptions) => {
        if (options?.ex) {
          tx.setex(key, options.ex, value);
        } else {
          tx.set(key, value);
        }
        return wrapper;
      },
      incr: (key: string) => {
        tx.incr(key);
        return wrapper;
      },
      decr: (key: string) => {
        tx.decr(key);
        return wrapper;
      },
      hset: (key: string, field: string, value: string) => {
        tx.hset(key, { [field]: value });
        return wrapper;
      },
      hdel: (key: string, ...fields: string[]) => {
        tx.hdel(key, ...fields);
        return wrapper;
      },
      lpush: (key: string, ...values: string[]) => {
        tx.lpush(key, ...values);
        return wrapper;
      },
      rpush: (key: string, ...values: string[]) => {
        tx.rpush(key, ...values);
        return wrapper;
      },
      sadd: (key: string, ...members: string[]) => {
        if (members.length > 0) tx.sadd(key, members[0]!, ...members.slice(1));
        return wrapper;
      },
      srem: (key: string, ...members: string[]) => {
        if (members.length > 0) tx.srem(key, ...members);
        return wrapper;
      },
      zadd: (key: string, score: number, member: string) => {
        tx.zadd(key, { score, member });
        return wrapper;
      },
      del: (...keys: string[]) => {
        if (keys.length > 0) tx.del(...keys);
        return wrapper;
      },
      expire: (key: string, seconds: number) => {
        tx.expire(key, seconds);
        return wrapper;
      },
      exec: async (): Promise<unknown[] | null> => {
        const results = await tx.exec();
        return results as unknown[];
      },
      discard: async (): Promise<'OK'> => {
        // Upstash multi doesn't support discard — throw informative error
        throw new Error(
          'Upstash HTTP backend does not support DISCARD. Use ioredis for full transaction support.'
        );
      },
    };

    return wrapper;
  }

  /** @inheritdoc */
  public async watch(..._keys: string[]): Promise<'OK'> {
    throw new Error(
      'Upstash HTTP backend does not support WATCH. Use ioredis for optimistic locking.'
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Pub/Sub
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async publish(channel: string, message: string): Promise<number> {
    return this.redis.publish(channel, message);
  }

  /** @inheritdoc */
  public subscribe<TMessage = unknown>(_channels: string | string[]): IRedisSubscriber<TMessage> {
    throw new Error(
      'Upstash HTTP backend does not support SUBSCRIBE. Use ioredis for pub/sub subscriptions.'
    );
  }

  /** @inheritdoc */
  public psubscribe<TMessage = unknown>(_patterns: string | string[]): IRedisSubscriber<TMessage> {
    throw new Error(
      'Upstash HTTP backend does not support PSUBSCRIBE. Use ioredis for pub/sub subscriptions.'
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async disconnect(): Promise<void> {
    // No-op for HTTP-backed connections — there is no persistent socket.
  }
}
