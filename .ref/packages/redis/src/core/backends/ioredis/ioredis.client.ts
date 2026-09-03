/**
 * @file ioredis.client.ts
 * @module @stackra/ts-redis/backends/ioredis
 * @description Ioredis TCP-backed Redis client implementing the full
 *   `IRedisClient` interface. Supports standalone, sentinel, and cluster
 *   topologies. Server-only — uses Node net/tls modules.
 */

import type { Cluster, Redis as IORedisClient } from 'ioredis';
import type {
  IRedisClient,
  IRedisPipeline,
  IRedisSubscriber,
  IRedisTransaction,
  ISetOptions,
  RedisPipelineResult,
} from '@stackra/contracts';

import { IoredisSubscriber } from './ioredis.subscriber';

/**
 * Ioredis client adapter.
 *
 * Wraps an ioredis client to satisfy `IRedisClient`. Pub/sub spawns
 * a dedicated subscriber-mode client via the `subscriberFactory` callback.
 */
export class IoredisClient implements IRedisClient {
  /**
   * @param client - Ioredis client (standalone or cluster).
   * @param name - Logical connection name.
   * @param subscriberFactory - Factory that creates subscriber-mode clients.
   */
  public constructor(
    private readonly client: IORedisClient | Cluster,
    private readonly name: string,
    private readonly subscriberFactory: () => IORedisClient
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
    return this.client.get(key);
  }

  /** @inheritdoc */
  public async set(key: string, value: string, options?: ISetOptions): Promise<'OK' | null> {
    if (!options) return (await this.client.set(key, value)) as 'OK' | null;

    const args: (string | number)[] = [];
    if (options.ex !== undefined) args.push('EX', options.ex);
    else if (options.px !== undefined) args.push('PX', options.px);
    if (options.nx) args.push('NX');
    else if (options.xx) args.push('XX');

    const setFn = (this.client as IORedisClient).set.bind(this.client) as unknown as (
      key: string,
      value: string,
      ...args: (string | number)[]
    ) => Promise<'OK' | null>;
    return setFn(key, value, ...args);
  }

  /** @inheritdoc */
  public async mget(...keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    return this.client.mget(...keys);
  }

  /** @inheritdoc */
  public async mset(data: Record<string, string>): Promise<'OK'> {
    return (await this.client.mset(data)) as 'OK';
  }

  /** @inheritdoc */
  public async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /** @inheritdoc */
  public async incrby(key: string, increment: number): Promise<number> {
    return this.client.incrby(key, increment);
  }

  /** @inheritdoc */
  public async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  /** @inheritdoc */
  public async decrby(key: string, decrement: number): Promise<number> {
    return this.client.decrby(key, decrement);
  }

  /** @inheritdoc */
  public async append(key: string, value: string): Promise<number> {
    return this.client.append(key, value);
  }

  /** @inheritdoc */
  public async getrange(key: string, start: number, end: number): Promise<string> {
    return this.client.getrange(key, start, end);
  }

  // ──────────────────────────────────────────────────────────────────
  // Hash Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  /** @inheritdoc */
  public async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  /** @inheritdoc */
  public async hdel(key: string, ...fields: string[]): Promise<number> {
    if (fields.length === 0) return 0;
    return this.client.hdel(key, ...fields);
  }

  /** @inheritdoc */
  public async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  /** @inheritdoc */
  public async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
    if (fields.length === 0) return [];
    return this.client.hmget(key, ...fields);
  }

  /** @inheritdoc */
  public async hmset(key: string, data: Record<string, string>): Promise<'OK'> {
    return (await this.client.hmset(key, data)) as 'OK';
  }

  /** @inheritdoc */
  public async hincrby(key: string, field: string, increment: number): Promise<number> {
    return this.client.hincrby(key, field, increment);
  }

  /** @inheritdoc */
  public async hexists(key: string, field: string): Promise<number> {
    return this.client.hexists(key, field);
  }

  /** @inheritdoc */
  public async hkeys(key: string): Promise<string[]> {
    return this.client.hkeys(key);
  }

  /** @inheritdoc */
  public async hvals(key: string): Promise<string[]> {
    return this.client.hvals(key);
  }

  /** @inheritdoc */
  public async hlen(key: string): Promise<number> {
    return this.client.hlen(key);
  }

  // ──────────────────────────────────────────────────────────────────
  // List Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async lpush(key: string, ...values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    return this.client.lpush(key, ...values);
  }

  /** @inheritdoc */
  public async rpush(key: string, ...values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    return this.client.rpush(key, ...values);
  }

  /** @inheritdoc */
  public async lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  /** @inheritdoc */
  public async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  /** @inheritdoc */
  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  /** @inheritdoc */
  public async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }

  /** @inheritdoc */
  public async lrem(key: string, count: number, value: string): Promise<number> {
    return this.client.lrem(key, count, value);
  }

  /** @inheritdoc */
  public async lindex(key: string, index: number): Promise<string | null> {
    return this.client.lindex(key, index);
  }

  /** @inheritdoc */
  public async lset(key: string, index: number, value: string): Promise<'OK'> {
    return (await this.client.lset(key, index, value)) as 'OK';
  }

  /** @inheritdoc */
  public async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    return (await this.client.ltrim(key, start, stop)) as 'OK';
  }

  // ──────────────────────────────────────────────────────────────────
  // Set Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async sadd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.client.sadd(key, ...members);
  }

  /** @inheritdoc */
  public async srem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.client.srem(key, ...members);
  }

  /** @inheritdoc */
  public async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  /** @inheritdoc */
  public async sismember(key: string, member: string): Promise<number> {
    return this.client.sismember(key, member);
  }

  /** @inheritdoc */
  public async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  /** @inheritdoc */
  public async spop(key: string, count?: number): Promise<string | string[] | null> {
    return count !== undefined ? this.client.spop(key, count) : this.client.spop(key);
  }

  /** @inheritdoc */
  public async srandmember(key: string, count?: number): Promise<string | string[] | null> {
    return count !== undefined ? this.client.srandmember(key, count) : this.client.srandmember(key);
  }

  /** @inheritdoc */
  public async sdiff(...keys: string[]): Promise<string[]> {
    if (keys.length === 0) return [];
    return this.client.sdiff(...keys);
  }

  /** @inheritdoc */
  public async sinter(...keys: string[]): Promise<string[]> {
    if (keys.length === 0) return [];
    return this.client.sinter(...keys);
  }

  /** @inheritdoc */
  public async sunion(...keys: string[]): Promise<string[]> {
    if (keys.length === 0) return [];
    return this.client.sunion(...keys);
  }

  // ──────────────────────────────────────────────────────────────────
  // Sorted Set Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async zadd(key: string, score: number, member: string): Promise<number> {
    return Number(await this.client.zadd(key, score, member)) || 0;
  }

  /** @inheritdoc */
  public async zrem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.client.zrem(key, ...members);
  }

  /** @inheritdoc */
  public async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrange(key, start, stop);
  }

  /** @inheritdoc */
  public async zrangebyscore(
    key: string,
    min: number | string,
    max: number | string
  ): Promise<string[]> {
    return this.client.zrangebyscore(key, min, max);
  }

  /** @inheritdoc */
  public async zrank(key: string, member: string): Promise<number | null> {
    return this.client.zrank(key, member);
  }

  /** @inheritdoc */
  public async zscore(key: string, member: string): Promise<string | null> {
    return this.client.zscore(key, member);
  }

  /** @inheritdoc */
  public async zcard(key: string): Promise<number> {
    return this.client.zcard(key);
  }

  /** @inheritdoc */
  public async zcount(key: string, min: number | string, max: number | string): Promise<number> {
    return this.client.zcount(key, min, max);
  }

  /** @inheritdoc */
  public async zincrby(key: string, increment: number, member: string): Promise<string> {
    return this.client.zincrby(key, increment, member);
  }

  /** @inheritdoc */
  public async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    return this.client.zremrangebyscore(key, min, max);
  }

  /** @inheritdoc */
  public async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    return this.client.zremrangebyrank(key, start, stop);
  }

  // ──────────────────────────────────────────────────────────────────
  // Key Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  /** @inheritdoc */
  public async unlink(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.unlink(...keys);
  }

  /** @inheritdoc */
  public async exists(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.exists(...keys);
  }

  /** @inheritdoc */
  public async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  /** @inheritdoc */
  public async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /** @inheritdoc */
  public async pttl(key: string): Promise<number> {
    return this.client.pttl(key);
  }

  /** @inheritdoc */
  public async persist(key: string): Promise<number> {
    return this.client.persist(key);
  }

  /** @inheritdoc */
  public async rename(key: string, newKey: string): Promise<'OK'> {
    return (await this.client.rename(key, newKey)) as 'OK';
  }

  /** @inheritdoc */
  public async type(key: string): Promise<string> {
    return this.client.type(key);
  }

  /** @inheritdoc */
  public async scan(
    cursor: number,
    options?: { match?: string; count?: number }
  ): Promise<[number, string[]]> {
    const args: (string | number)[] = [];
    if (options?.match) args.push('MATCH', options.match);
    if (options?.count) args.push('COUNT', options.count);
    const scanFn = (this.client as IORedisClient).scan.bind(this.client) as unknown as (
      cursor: number,
      ...args: (string | number)[]
    ) => Promise<[string, string[]]>;
    const result = await scanFn(cursor, ...args);
    return [Number(result[0]), result[1]];
  }

  /** @inheritdoc */
  public async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  // ──────────────────────────────────────────────────────────────────
  // Server Commands
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async ping(): Promise<string> {
    return this.client.ping();
  }

  /** @inheritdoc */
  public async flushdb(): Promise<'OK'> {
    return (await this.client.flushdb()) as 'OK';
  }

  /** @inheritdoc */
  public async flushall(): Promise<'OK'> {
    return (await this.client.flushall()) as 'OK';
  }

  /** @inheritdoc */
  public async dbsize(): Promise<number> {
    return this.client.dbsize();
  }

  /** @inheritdoc */
  public async info(section?: string): Promise<string> {
    return section ? this.client.info(section) : this.client.info();
  }

  /** @inheritdoc */
  public async time(): Promise<[string, string]> {
    return this.client.time() as unknown as Promise<[string, string]>;
  }

  // ──────────────────────────────────────────────────────────────────
  // Lua Scripting
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }

  /** @inheritdoc */
  public async evalsha(sha: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    return this.client.evalsha(sha, keys.length, ...keys, ...args);
  }

  // ──────────────────────────────────────────────────────────────────
  // Pipeline & Transaction
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public pipeline(): IRedisPipeline {
    const pipe = this.client.pipeline();
    const wrapper: IRedisPipeline = {
      get: (key: string) => {
        pipe.get(key);
        return wrapper;
      },
      set: (key: string, value: string, options?: ISetOptions) => {
        if (!options) {
          pipe.set(key, value);
          return wrapper;
        }
        const args: (string | number)[] = [];
        if (options.ex !== undefined) args.push('EX', options.ex);
        else if (options.px !== undefined) args.push('PX', options.px);
        if (options.nx) args.push('NX');
        else if (options.xx) args.push('XX');
        (pipe.set as Function).call(pipe, key, value, ...args);
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
        pipe.hset(key, field, value);
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
        pipe.sadd(key, ...members);
        return wrapper;
      },
      srem: (key: string, ...members: string[]) => {
        pipe.srem(key, ...members);
        return wrapper;
      },
      zadd: (key: string, score: number, member: string) => {
        pipe.zadd(key, score, member);
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
        const results = await pipe.exec();
        if (!results) return [];
        return results.map(([err, value]) => [err ?? null, value ?? null] as RedisPipelineResult);
      },
    };
    return wrapper;
  }

  /** @inheritdoc */
  public multi(): IRedisTransaction {
    const tx = this.client.multi();
    const wrapper: IRedisTransaction = {
      get: (key: string) => {
        tx.get(key);
        return wrapper;
      },
      set: (key: string, value: string, options?: ISetOptions) => {
        if (!options) {
          tx.set(key, value);
          return wrapper;
        }
        const args: (string | number)[] = [];
        if (options.ex !== undefined) args.push('EX', options.ex);
        else if (options.px !== undefined) args.push('PX', options.px);
        if (options.nx) args.push('NX');
        else if (options.xx) args.push('XX');
        (tx.set as Function).call(tx, key, value, ...args);
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
        tx.hset(key, field, value);
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
        tx.sadd(key, ...members);
        return wrapper;
      },
      srem: (key: string, ...members: string[]) => {
        tx.srem(key, ...members);
        return wrapper;
      },
      zadd: (key: string, score: number, member: string) => {
        tx.zadd(key, score, member);
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
        if (!results) return null;
        return results.map(([_err, value]) => value);
      },
      discard: async (): Promise<'OK'> => {
        await tx.discard();
        return 'OK';
      },
    };
    return wrapper;
  }

  /** @inheritdoc */
  public async watch(...keys: string[]): Promise<'OK'> {
    if (keys.length === 0) return 'OK';
    return (await (this.client as IORedisClient).watch(...keys)) as 'OK';
  }

  // ──────────────────────────────────────────────────────────────────
  // Pub/Sub
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  /** @inheritdoc */
  public subscribe<TMessage = unknown>(channels: string | string[]): IRedisSubscriber<TMessage> {
    return new IoredisSubscriber<TMessage>(this.subscriberFactory(), channels, 'channels');
  }

  /** @inheritdoc */
  public psubscribe<TMessage = unknown>(patterns: string | string[]): IRedisSubscriber<TMessage> {
    return new IoredisSubscriber<TMessage>(this.subscriberFactory(), patterns, 'patterns');
  }

  // ──────────────────────────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      try {
        this.client.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
}
