/**
 * @file coordinator-transport.service.ts
 * @module @stackra/coordinator/core/services
 * @description Cross-tab event relay transport for `@stackra/events`.
 *   Implements `IEventTransport` — relays events matching configured
 *   patterns to all other browser tabs via the shared
 *   `ITabTransportManager`.
 *
 *   Register with `@EventTransport({ name: 'cross-tab' })` for
 *   auto-discovery, or register manually via
 *   `EventTransportRegistry`.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import {
  TAB_TRANSPORT_MANAGER,
  type IEventEmitterSync,
  type ITabTransport,
  type ITabTransportManager,
} from "@stackra/contracts";
import { COORDINATOR_CONFIG } from "@stackra/contracts";
import { EventTransport } from "@stackra/events";
import { Str } from "@stackra/support";

import type { ICoordinatorModuleOptions } from "../interfaces";
import type { IRelayMessage } from "../interfaces/relay-message.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/** Channel name shared by every tab for event relay. */
const RELAY_CHANNEL = "stackra-event-relay";

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Cross-tab event relay transport.
 *
 * When connected to the EventEmitter, subscribes to all events
 * matching the configured patterns and relays them to other tabs
 * through the shared `ITabTransportManager`. Inbound relayed events
 * are re-emitted on the local EventEmitter.
 *
 * @example
 * ```typescript
 * // Events matching 'auth.**' or 'sync.**' are relayed to all tabs.
 * // Tab A emits 'auth.logout' → Tab B/C/D receive it locally.
 * ```
 */
@Injectable()
@EventTransport({ name: "cross-tab" })
export class CoordinatorTransport {
  /** Channel handle resolved from the transport manager. */
  private transport: ITabTransport | null = null;

  /** Unsubscribe handle from the transport's subscribe call. */
  private unsubscribe: (() => void) | null = null;

  /** Unsubscribe handle for the outbound wildcard listener. */
  private outboundOff: (() => void) | null = null;

  /** The connected emitter instance. */
  private emitter: IEventEmitterSync | null = null;

  /** Unique tab ID to prevent echo (don't re-emit own events). */
  private readonly tabId: string;

  /** Patterns to match for relay. */
  private readonly patterns: string[];

  /** Delimiter for pattern matching. */
  private readonly delimiter = ".";

  /** Whether broadcasting is enabled. */
  private readonly enabled: boolean;

  /**
   * Guard flag — set while an inbound peer event is being
   * re-emitted locally so the outbound wildcard listener skips
   * re-broadcasting the same event. Echo suppression is critical
   * to prevent infinite tab-A → tab-B → tab-A loops.
   */
  private applyingInbound = false;

  /**
   * @param manager - Optional transport manager. When absent (SSR /
   *   non-DOM) the transport is inert.
   * @param config - Module configuration.
   */
  public constructor(
    @Optional()
    @Inject(TAB_TRANSPORT_MANAGER)
    private readonly manager?: ITabTransportManager,
    @Optional() @Inject(COORDINATOR_CONFIG) config?: ICoordinatorModuleOptions,
  ) {
    this.tabId = Str.uuid();
    this.patterns = config?.broadcastPatterns ?? [
      "sync.**",
      "auth.**",
      "state.**",
      "theming.**",
      "i18n.**",
      "consent.**",
      "notifications.**",
    ];
    this.enabled = config?.broadcastEvents ?? true;
  }

  /**
   * Connect the transport to an EventEmitter.
   *
   * Called by EventSubscribersLoader at bootstrap (if decorated with
   * `@EventTransport`) or manually.
   *
   * @param emitter - The application's EventEmitter
   */
  public connect(emitter: IEventEmitterSync): void {
    if (!this.enabled) return;
    if (!this.manager?.isSupported()) return;

    this.emitter = emitter;
    this.transport = this.manager.channel(RELAY_CHANNEL);

    // Inbound path — peer tabs push events into our local emitter.
    // The `applyingInbound` flag suppresses the outbound listener
    // for the duration of the local re-emit so the same event
    // doesn't bounce back out.
    this.unsubscribe = this.transport.subscribe((data) => {
      const msg = data as IRelayMessage;
      if (msg?.kind !== "event-relay") return;
      if (msg.sourceTabId === this.tabId) return; // Don't echo own events

      this.applyingInbound = true;
      try {
        this.emitter?.emit(msg.event, ...msg.args);
      } finally {
        this.applyingInbound = false;
      }
    });

    // Outbound path — a wildcard listener on the local emitter
    // forwards every emit to `relay()`, which pattern-filters and
    // broadcasts via `BroadcastChannel`. This is what makes local
    // mutations reach other tabs. `EventEmitter` supports the
    // `**` wildcard when constructed with `wildcard: true`; the
    // app-side config wires that on.
    const emitterWithOn = emitter as IEventEmitterSync & {
      on?: (
        event: string,
        listener: (event: string, ...args: unknown[]) => void,
      ) => unknown;
    };
    if (typeof emitterWithOn.on === "function") {
      const listener = (event: string | symbol, ...args: unknown[]): void => {
        if (typeof event !== "string") return;
        this.relay(event, ...args);
      };
      emitterWithOn.on("**", listener);
      this.outboundOff = () => {
        const off = (
          emitter as unknown as {
            off?: (event: string, listener: unknown) => unknown;
          }
        ).off;
        if (typeof off === "function")
          off.call(emitter, "**", listener as never);
      };
    }
  }

  /**
   * Disconnect the transport and release resources.
   */
  public disconnect(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.outboundOff?.();
    this.outboundOff = null;
    // The transport manager owns channel lifecycle — don't close
    // the shared channel from here; other subscribers may still
    // rely on it.
    this.transport = null;
    this.emitter = null;
  }

  /**
   * Relay an event to other tabs (called when a matching event is
   * emitted locally).
   *
   * @param event - Event name
   * @param args - Event arguments
   */
  public relay(event: string, ...args: unknown[]): void {
    if (!this.transport) return;
    // Echo-suppression: skip when the emit was triggered by an
    // inbound peer message — that emit is the peer's echo, not
    // a new local mutation.
    if (this.applyingInbound) return;
    if (!this.matchesPatterns(event)) return;

    const msg: IRelayMessage = {
      kind: "event-relay",
      event,
      args,
      sourceTabId: this.tabId,
    };

    this.transport.broadcast(msg);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Pattern Matching
  // ══════════════════════════════════════════════════════════════════════════════

  /** Check if an event matches any of the configured patterns. */
  private matchesPatterns(event: string): boolean {
    return this.patterns.some((pattern) => this.matchWildcard(pattern, event));
  }

  /** Wildcard pattern match (* = one segment, ** = one or more). */
  private matchWildcard(pattern: string, event: string): boolean {
    const pp = pattern.split(this.delimiter);
    const ep = event.split(this.delimiter);
    return this.matchParts(pp, 0, ep, 0);
  }

  private matchParts(
    pattern: string[],
    pi: number,
    event: string[],
    ei: number,
  ): boolean {
    if (pi === pattern.length && ei === event.length) return true;
    if (pi === pattern.length) return false;
    const seg = pattern[pi];
    if (seg === "**") {
      for (let skip = 1; skip <= event.length - ei; skip++) {
        if (this.matchParts(pattern, pi + 1, event, ei + skip)) return true;
      }
      return false;
    }
    if (ei === event.length) return false;
    if (seg === "*") return this.matchParts(pattern, pi + 1, event, ei + 1);
    if (seg === event[ei])
      return this.matchParts(pattern, pi + 1, event, ei + 1);
    return false;
  }
}
