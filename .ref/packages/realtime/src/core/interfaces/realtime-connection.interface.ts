/**
 * @file realtime-connection.interface.ts
 * @module @stackra/realtime/core/interfaces
 * @description Contract for realtime connections — runtime handle for
 *   channel subscription, event listening, and disconnection.
 */

/**
 * A realtime connection — runtime handle for WebSocket communication.
 *
 * Provides channel-based subscription and event listening. Each named
 * connection corresponds to a server endpoint.
 */
export interface IRealtimeConnection {
  /** Subscribe to a public channel. Returns an unsubscribe function. */
  channel(name: string): IRealtimeChannel;

  /** Subscribe to a private channel (requires auth). */
  privateChannel(name: string): IRealtimeChannel;

  /** Subscribe to a presence channel (auth + member tracking). */
  presenceChannel(name: string): IRealtimePresenceChannel;

  /** Disconnect from the server. */
  disconnect(): void;

  /** Whether the connection is currently active. */
  isConnected(): boolean;
}

/**
 * A subscribed channel — listen for events on this channel.
 */
export interface IRealtimeChannel {
  /** Listen for an event on this channel. */
  on(event: string, handler: (data: unknown) => void): this;

  /** Remove a listener. */
  off(event: string, handler: (data: unknown) => void): this;

  /** Leave the channel (unsubscribe). */
  leave(): void;

  /** Send a client event to other channel members (whisper). */
  whisper(event: string, data: unknown): this;
}

/**
 * A presence channel — tracks who's online.
 */
export interface IRealtimePresenceChannel extends IRealtimeChannel {
  /** Get current members. */
  here(callback: (members: unknown[]) => void): this;

  /** Listen for a member joining. */
  joining(callback: (member: unknown) => void): this;

  /** Listen for a member leaving. */
  leaving(callback: (member: unknown) => void): this;
}
