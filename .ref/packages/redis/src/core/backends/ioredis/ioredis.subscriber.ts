/**
 * @file ioredis.subscriber.ts
 * @module @stackra/ts-redis/backends/ioredis
 * @description Ioredis pub/sub subscriber adapter. Bridges ioredis's native
 *   event-emitter pattern to the cross-driver `IRedisSubscriber` contract.
 *   Each instance owns a dedicated subscriber-mode ioredis client.
 */

import type { Redis as IORedisClient } from 'ioredis';
import type { IRedisSubscriber, IRedisSubscriberEventMap } from '@stackra/contracts';

/**
 * Subscription mode — ioredis distinguishes between exact channels
 * and pattern subscriptions.
 */
type SubscriptionMode = 'channels' | 'patterns';

/**
 * Ioredis subscriber implementation.
 *
 * Each instance owns a dedicated subscriber-mode ioredis client so it
 * can run independently of the publishing connection.
 *
 * @typeParam TMessage - Expected payload type (defaults to `unknown`).
 */
export class IoredisSubscriber<TMessage = unknown> implements IRedisSubscriber<TMessage> {
  /** Channels this subscriber is bound to. */
  private readonly channels: Set<string> = new Set();

  /** Patterns this subscriber is bound to. */
  private readonly patterns: Set<string> = new Set();

  /** Map of event type to listener set. */
  private readonly listeners: Map<
    keyof IRedisSubscriberEventMap<TMessage>,
    Set<(payload: unknown) => void>
  > = new Map();

  /** True once the subscriber has subscribed at least once. */
  private subscribedOnce = false;

  /**
   * @param client - Subscriber-mode ioredis client (one per subscriber).
   * @param targets - Channels or patterns to subscribe to.
   * @param mode - Whether targets are exact channels or glob patterns.
   */
  public constructor(
    private readonly client: IORedisClient,
    targets: string | string[],
    private readonly mode: SubscriptionMode
  ) {
    const list = Array.isArray(targets) ? targets : [targets];
    for (const target of list) {
      if (mode === 'channels') {
        this.channels.add(target);
      } else {
        this.patterns.add(target);
      }
    }

    this.bindNativeListeners();
    void this.subscribeAll(list);
  }

  // ──────────────────────────────────────────────────────────────────
  // IRedisSubscriber
  // ──────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public on<T extends keyof IRedisSubscriberEventMap<TMessage>>(
    type: T,
    listener: (event: IRedisSubscriberEventMap<TMessage>[T]) => void
  ): void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener as (payload: unknown) => void);
    this.listeners.set(type, set);
  }

  /** @inheritdoc */
  public removeAllListeners(): void {
    this.listeners.clear();
  }

  /** @inheritdoc */
  public async unsubscribe(channels?: string[]): Promise<void> {
    if (this.mode === 'channels') {
      const targets = channels && channels.length > 0 ? channels : Array.from(this.channels);
      if (targets.length > 0) {
        await this.client.unsubscribe(...targets);
        for (const c of targets) this.channels.delete(c);
      }
    } else {
      const targets = channels && channels.length > 0 ? channels : Array.from(this.patterns);
      if (targets.length > 0) {
        await this.client.punsubscribe(...targets);
        for (const p of targets) this.patterns.delete(p);
      }
    }

    if (this.channels.size === 0 && this.patterns.size === 0) {
      this.client.disconnect();
    }
  }

  /** @inheritdoc */
  public getSubscribedChannels(): string[] {
    return this.mode === 'channels' ? Array.from(this.channels) : Array.from(this.patterns);
  }

  // ──────────────────────────────────────────────────────────────────
  // Internal
  // ──────────────────────────────────────────────────────────────────

  /**
   * Subscribe to the initial set of channels or patterns.
   *
   * @param targets - Channels or patterns provided to the constructor.
   */
  private async subscribeAll(targets: string[]): Promise<void> {
    if (targets.length === 0) return;
    try {
      if (this.mode === 'channels') {
        const count = await this.client.subscribe(...targets);
        this.subscribedOnce = true;
        this.fire('subscribe', { channel: targets[0]!, count: Number(count) });
      } else {
        const count = await this.client.psubscribe(...targets);
        this.subscribedOnce = true;
        this.fire('subscribe', { channel: targets[0]!, count: Number(count) });
      }
    } catch {
      this.fire('subscribe', { channel: targets[0] ?? '', count: 0 });
    }
  }

  /**
   * Bridge native ioredis events to the typed contract's event map.
   */
  private bindNativeListeners(): void {
    this.client.on('message', (channel: string, message: string) => {
      this.fire('message', { channel, message: this.parseMessage(message) as TMessage });
    });

    this.client.on('pmessage', (pattern: string, channel: string, message: string) => {
      this.fire('pmessage', { pattern, channel, message: this.parseMessage(message) as TMessage });
    });

    this.client.on('subscribe', (channel: string, count: number) => {
      if (this.subscribedOnce) this.fire('subscribe', { channel, count });
    });

    this.client.on('unsubscribe', (channel: string, count: number) => {
      this.fire('unsubscribe', { channel, count });
    });

    this.client.on('psubscribe', (pattern: string, count: number) => {
      if (this.subscribedOnce) this.fire('subscribe', { channel: pattern, count });
    });

    this.client.on('punsubscribe', (pattern: string, count: number) => {
      this.fire('unsubscribe', { channel: pattern, count });
    });
  }

  /**
   * Dispatch an event to every registered listener.
   *
   * @param type - Event-map key.
   * @param payload - Payload matching the event's typed shape.
   */
  private fire<T extends keyof IRedisSubscriberEventMap<TMessage>>(
    type: T,
    payload: IRedisSubscriberEventMap<TMessage>[T]
  ): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;
    for (const listener of listeners) {
      try {
        listener(payload);
      } catch {
        // Listener errors are swallowed — they should never break the pub/sub stream.
      }
    }
  }

  /**
   * Try to JSON-parse a string; fall back to the raw value.
   *
   * @param raw - Raw string from ioredis.
   * @returns Parsed value or the original string.
   */
  private parseMessage(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
}
