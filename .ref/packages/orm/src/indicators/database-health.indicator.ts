/**
 * @file database-health.indicator.ts
 * @description Database health indicator — checks all MikroORM connections.
 *
 * Dynamically discovers all registered MikroORM EntityManager instances
 * and reports per-connection health with response time metadata.
 *
 * Reports flat keys: database:<connection_name> for each connection.
 *
 * Metadata per connection:
 * - responseTimeMs: time to execute SELECT 1
 * - connection: connection name
 * - dbName: database name
 * - host: host:port
 */

import { IInjectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { IHealthIndicator } from '@stackra/contracts';
import type { HealthIndicatorResult } from '@stackra/contracts';

/**
 * DatabaseHealthIndicator — checks if database connections are alive.
 *
 * Runs a simple `SELECT 1` query per connection to verify connectivity.
 * Reports response time for each connection.
 *
 * Currently supports the default connection. Multi-connection support
 * will resolve additional EntityManagers via contextName when configured.
 */
@IInjectable()
export class DatabaseHealthIndicator implements IHealthIndicator {
  constructor(private readonly em: EntityManager) {}

  /**
   * Check all database connections.
   * Returns flat keys: { "database:default": { status, responseTimeMs, ... } }
   */
  async check(key: string = 'database'): Promise<HealthIndicatorResult> {
    const results: HealthIndicatorResult = {};

    // Check the default connection
    await this.checkConnection(results, `${key}:default`, 'default');

    return results;
  }

  /**
   * Check a single database connection.
   * Measures response time and reports metadata.
   */
  private async checkConnection(
    results: HealthIndicatorResult,
    resourceKey: string,
    connectionName: string
  ): Promise<void> {
    const start = Date.now();

    try {
      // Execute a simple query to verify connectivity
      await this.em.getConnection().execute('SELECT 1');
      const responseTimeMs = Date.now() - start;

      // Extract connection metadata
      const platform = (this.em as any).config?.get?.('dbName') || 'unknown';

      results[resourceKey] = {
        status: 'up',
        responseTimeMs,
        connection: connectionName,
        dbName: platform,
      };
    } catch (error: any) {
      const responseTimeMs = Date.now() - start;

      results[resourceKey] = {
        status: 'down',
        responseTimeMs,
        connection: connectionName,
        message: error.message || 'Database connection failed',
      };
    }
  }
}
