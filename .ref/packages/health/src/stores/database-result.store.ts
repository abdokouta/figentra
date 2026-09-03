/**
 * @file database-result.store.ts
 * @module @stackra/nestjs-health/stores
 * @description Database-backed result store for long-term health history.
 *   Uses raw SQL via a minimal EntityManager interface for now.
 *
 *   @todo Refactor to use `@stackra/nestjs-orm` properly:
 *     1. Create a `HealthCheckResult` entity with `@Entity({ tableName: 'health_check_results' })`
 *     2. Use `@Timestamps()` trait instead of manual `created_at`
 *     3. Use `@InjectRepository(HealthCheckResult)` instead of raw SQL
 *     4. Register entity via `OrmModule.forFeature([HealthCheckResult])` in the health module
 *     5. Use `repo.find()`, `repo.count()`, `em.create()`, `em.persist()`, `em.flush()`
 *     6. Replace manual UUID generation with `BaseEntity.id` (auto UUID PK)
 *     7. Replace raw `CREATE TABLE IF NOT EXISTS` with MikroORM migrations
 *     8. Use `em.nativeDelete()` for pruning with proper WHERE clause
 *     9. Store `results` as `@Property({ type: 'json' })` column
 *     10. Type the `status` field as `@Property({ type: 'enum', enum: HealthStatus })`
 *
 *   Requires `@stackra/nestjs-orm` to be configured in the application.
 */

import { IInjectable, Inject, Optional, Logger } from '@nestjs/common';
import type { IResultStore, IAggregatedHealthResult, HealthStatus } from '@stackra/contracts';

/**
 * Database result store — persistent health history with querying.
 *
 * Stores health check results in a dedicated database table, enabling:
 * - Long-term trend analysis (weeks/months of history)
 * - Complex queries (status distribution, duration percentiles)
 * - Dashboard visualization
 * - Alerting rule evaluation against historical data
 * - Compliance reporting (uptime SLA calculations)
 *
 * The store auto-prunes old records based on `retentionDays` configuration.
 *
 * Table schema (auto-created if not exists):
 * ```sql
 * CREATE TABLE health_check_results (
 *   id UUID PRIMARY KEY,
 *   status VARCHAR(20) NOT NULL,
 *   timestamp TIMESTAMPTZ NOT NULL,
 *   duration INTEGER NOT NULL,
 *   results JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * CREATE INDEX idx_health_results_timestamp ON health_check_results(timestamp DESC);
 * ```
 *
 * @example
 * ```typescript
 * NestHealthModule.forRoot({
 *   resultStore: DatabaseResultStore,
 * });
 * ```
 */
@IInjectable()
export class DatabaseResultStore implements IResultStore {
  private readonly logger = new Logger(DatabaseResultStore.name);
  private readonly tableName: string;
  private readonly retentionDays: number;
  private initialized = false;

  /**
   * @param em - EntityManager for database operations
   * @param config - Store configuration
   */
  public constructor(
    @Optional() @Inject(HEALTH_ENTITY_MANAGER) private readonly em?: IEntityManagerLike,
    @Optional() @Inject('HEALTH_DB_STORE_CONFIG') config?: IDatabaseResultStoreConfig
  ) {
    this.tableName = config?.tableName ?? 'health_check_results';
    this.retentionDays = config?.retentionDays ?? 30;
  }

  /**
   * Store a health check result in the database.
   *
   * @param result - The aggregated result to store
   */
  public async store(result: IAggregatedHealthResult): Promise<void> {
    if (!this.em) {
      this.logger.warn('EntityManager not available — health result not persisted to database.');
      return;
    }

    await this.ensureTable();

    try {
      const id = this.generateUUID();
      const conn = this.em.getConnection();

      await conn.execute(
        `INSERT INTO ${this.tableName} (id, status, timestamp, duration, results) VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          result.status,
          result.timestamp.toISOString(),
          result.duration,
          JSON.stringify(result.results),
        ]
      );

      // Auto-prune if over max
      await this.autoPrune();
    } catch (err: Error | any) {
      this.logger.warn(`Failed to store health result in database: ${(err as Error).message}`);
    }
  }

  /**
   * Get the most recent stored result.
   *
   * @returns The latest result, or null when empty
   */
  public async getLatest(): Promise<IAggregatedHealthResult | null> {
    if (!this.em) return null;

    try {
      const conn = this.em.getConnection();
      const rows = await conn.execute(
        `SELECT status, timestamp, duration, results FROM ${this.tableName} ORDER BY timestamp DESC LIMIT 1`
      );

      if (!rows || rows.length === 0) return null;
      return this.rowToResult(rows[0]);
    } catch (err: Error | any) {
      this.logger.warn(
        `Failed to read latest health result from database: ${(err as Error).message}`
      );
      return null;
    }
  }

  /**
   * Get the N most recent results in reverse chronological order.
   *
   * @param limit - Number of results to retrieve
   * @returns Array of results (most recent first)
   */
  public async getHistory(limit: number): Promise<IAggregatedHealthResult[]> {
    if (!this.em) return [];

    try {
      const clampedLimit = Math.min(Math.max(1, limit), 1000);
      const conn = this.em.getConnection();
      const rows = await conn.execute(
        `SELECT status, timestamp, duration, results FROM ${this.tableName} ORDER BY timestamp DESC LIMIT $1`,
        [clampedLimit]
      );

      return (rows ?? []).map((row) => this.rowToResult(row));
    } catch (err: Error | any) {
      this.logger.warn(`Failed to read health history from database: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Remove results older than the specified date.
   *
   * @param olderThan - Cutoff date
   * @returns Number of pruned entries
   */
  public async prune(olderThan: Date): Promise<number> {
    if (!this.em) return 0;

    try {
      const conn = this.em.getConnection();
      const result = await conn.execute(`DELETE FROM ${this.tableName} WHERE timestamp < $1`, [
        olderThan.toISOString(),
      ]);

      const count = Array.isArray(result) ? result.length : 0;
      if (count > 0) {
        this.logger.debug(`Pruned ${count} old health results from database.`);
      }
      return count;
    } catch (err: Error | any) {
      this.logger.warn(`Failed to prune health results from database: ${(err as Error).message}`);
      return 0;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Ensure the health results table exists (create if not).
   * Only runs once per service lifetime.
   */
  private async ensureTable(): Promise<void> {
    if (this.initialized || !this.em) return;

    try {
      const conn = this.em.getConnection();
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          status VARCHAR(20) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          duration INTEGER NOT NULL,
          results JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await conn.execute(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_timestamp
        ON ${this.tableName}(timestamp DESC)
      `);
      this.initialized = true;
    } catch (err: Error | any) {
      this.logger.warn(`Failed to ensure health results table: ${(err as Error).message}`);
    }
  }

  /**
   * Auto-prune old results based on retention configuration.
   */
  private async autoPrune(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    await this.prune(cutoff);
  }

  /**
   * Convert a database row to an IAggregatedHealthResult.
   *
   * @param row - Raw database row
   * @returns Hydrated result
   */
  private rowToResult(row: any): IAggregatedHealthResult {
    const results = typeof row.results === 'string' ? JSON.parse(row.results) : row.results;

    // Hydrate dates in individual results
    const hydratedResults: Record<string, any> = {};
    for (const [name, r] of Object.entries(results ?? {})) {
      const entry = r as any;
      hydratedResults[name] = {
        ...entry,
        startedAt: entry.startedAt ? new Date(entry.startedAt) : new Date(),
        endedAt: entry.endedAt ? new Date(entry.endedAt) : undefined,
      };
    }

    return {
      status: row.status as HealthStatus,
      timestamp: new Date(row.timestamp),
      duration: row.duration,
      results: hydratedResults,
    };
  }

  /**
   * Generate a UUID v4.
   *
   * @returns UUID string
   */
  private generateUUID(): string {
    return crypto.randomUUID();
  }
}
