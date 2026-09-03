/**
 * @file realtime-manager.service.ts
 * @module @stackra/realtime/core/services
 * @description Multi-driver realtime manager — resolves named connections.
 *   Transport-agnostic. Drivers registered via `forFeature()`.
 */

import { IInjectable, Inject } from '@stackra/ts-container';
import { Manager } from '@stackra/ts-support';
import { REALTIME_CONFIG } from '../constants';
import { RealtimeConnectionError } from '../errors';
import type { IRealtimeConnection, IRealtimeModuleOptions } from '../interfaces';

/**
 * Realtime manager — resolves named WebSocket connections.
 *
 * No built-in drivers — drivers are registered via `RealtimeModule.forFeature()`.
 * This keeps the root entry transport-agnostic (no Socket.IO in the bundle
 * unless explicitly opted in).
 *
 * @example
 * ```typescript
 * const manager = container.get<RealtimeManager>(REALTIME_MANAGER);
 * const conn = await manager.connection();
 * const channel = conn.channel('orders');
 * channel.on('updated', (data) => console.log(data));
 * ```
 */
@IInjectable()
export class RealtimeManager extends Manager<IRealtimeConnection> {
  /** Resolved async connections cache. */
  private readonly asyncConnections = new Map<string, IRealtimeConnection>();

  /**
   * @param config - Realtime module configuration
   */
  public constructor(@Inject(REALTIME_CONFIG) private readonly config: IRealtimeModuleOptions) {
    super();
  }

  /**
   * Get the default driver name.
   *
   * @returns The configured default connection name
   */
  public getDefaultDriver(): string {
    return this.config.default;
  }

  /**
   * Resolve a named connection (async — connectors need handshake).
   *
   * @param name - Connection name (defaults to configured default)
   * @returns The resolved realtime connection
   */
  public async connection(name?: string): Promise<IRealtimeConnection> {
    const connectionName = name ?? this.config.default;
    const cached = this.asyncConnections.get(connectionName);
    if (cached) return cached;

    throw new RealtimeConnectionError(
      `Realtime driver for "${connectionName}" is not registered. ` +
        `Use RealtimeModule.forFeature(driver, ConnectorClass) to register.`
    );
  }

  /**
   * Register a resolved connection (called by forFeature providers).
   *
   * @param name - Connection name
   * @param connection - The connected instance
   */
  public registerConnection(name: string, connection: IRealtimeConnection): void {
    this.asyncConnections.set(name, connection);
  }

  /**
   * Disconnect a specific connection.
   *
   * @param name - Connection name
   */
  public async disconnect(name?: string): Promise<void> {
    const connectionName = name ?? this.config.default;
    const conn = this.asyncConnections.get(connectionName);
    if (conn) {
      conn.disconnect();
      this.asyncConnections.delete(connectionName);
    }
  }

  /**
   * Disconnect all connections.
   */
  public async disconnectAll(): Promise<void> {
    for (const [name] of this.asyncConnections) {
      await this.disconnect(name);
    }
  }

  /**
   * Get all configured connection names.
   *
   * @returns Array of connection name strings
   */
  public getConnectionNames(): string[] {
    return Object.keys(this.config.connections);
  }
}
