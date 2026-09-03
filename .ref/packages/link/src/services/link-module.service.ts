/**
 * @file link-module.service.ts
 * @module @stackra/nestjs-link/services
 * @description High-level link service with event emission, validation, and serialization.
 *
 * `LinkModuleService` wraps `LinkService` with additional concerns:
 * - **Event emission** — publishes events via `@stackra/nestjs-pubsub` (IPubSubDriver)
 * - **Validation** — checks for invalid IDs, duplicate links, read-only violations
 * - **Serialization** — returns plain objects (no MikroORM proxies/references)
 * - **Error handling** — provides meaningful error messages
 *
 * ## Event Channels
 * Events follow the pattern: `link.<linkName>.<action>`
 * - `link.RolePermission.attached` — when new links are created
 * - `link.RolePermission.detached` — when links are removed
 * - `link.RolePermission.restored` — when soft-deleted links are restored
 * - `link.RolePermission.synced` — when links are synced (set operation)
 *
 * ## Event Payload (IPubSubMessage<LinkEventData>)
 * ```typescript
 * {
 *   event: 'link.RolePermission.attached',
 *   data: {
 *     linkName: 'RolePermission',
 *     sourceId: 'role_123',
 *     targetIds: ['perm_1', 'perm_2'],
 *     records: [...],
 *   },
 *   metadata: {
 *     source: '@stackra/nestjs-link',
 *     timestamp: new Date(),
 *   },
 * }
 * ```
 *
 * ## Usage
 * This is the recommended service for most consumers:
 * ```typescript
 * @InjectLink('RolePermission')
 * private readonly rolePermLink: LinkModuleService;
 *
 * await rolePermLink.attach(roleId, [permId1, permId2]);
 * ```
 */

import { IInjectable, Logger } from '@nestjs/common';
import type { IPubSubDriver, IPubSubMessage } from '@stackra/contracts';
import { LinkService } from './link.service';
import type { ILinkMetadata } from '../interfaces/link-metadata.interface';
import type { ILinkFilter } from '../interfaces/link-filter.interface';

/**
 * LinkModuleService — high-level service for link operations.
 *
 * Wraps `LinkService` with event emission via @stackra/nestjs-pubsub, validation,
 * and serialization. This is the primary service consumers should use.
 */
@IInjectable()
export class LinkModuleService {
  private readonly logger = new Logger(LinkModuleService.name);

  constructor(
    private readonly linkService: LinkService,
    private readonly metadata: ILinkMetadata,
    private readonly pubsub?: IPubSubDriver
  ) {}

  // ─── Accessors ──────────────────────────────────────────────────────────────

  /** The unique link name. */
  get name(): string {
    return this.metadata.name;
  }

  /** The link metadata. */
  get meta(): ILinkMetadata {
    return this.metadata;
  }

  /** Whether this link is read-only (no write operations allowed). */
  get isReadOnly(): boolean {
    return this.metadata.readOnly;
  }

  // ─── Write Operations ───────────────────────────────────────────────────────

  /**
   * Attach target entities to a source entity.
   * Publishes `link.<name>.attached` event after successful creation.
   *
   * @param sourceId - The source entity's ID
   * @param targetIds - One or more target entity IDs to link
   * @param pivotData - Optional extra column values
   * @returns Array of created pivot records (serialized)
   * @throws Error if the link is read-only
   *
   * @example
   * ```typescript
   * const records = await service.attach(roleId, [permId1, permId2]);
   * ```
   */
  public async attach(
    sourceId: string,
    targetIds: string | string[],
    pivotData?: Record<string, any>
  ): Promise<any[]> {
    this.assertWritable();
    this.assertValidId(sourceId, 'sourceId');

    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    ids.forEach((id) => this.assertValidId(id, 'targetId'));

    const records = await this.linkService.attach(sourceId, ids, pivotData);
    const serialized = this.serialize(records);

    // Publish event via PubSub
    this.emit('attached', {
      linkName: this.metadata.name,
      sourceId,
      targetIds: ids,
      records: serialized,
    });

    return serialized;
  }

  /**
   * Detach target entities from a source entity.
   * Publishes `link.<name>.detached` event after successful removal.
   *
   * @param sourceId - The source entity's ID
   * @param targetIds - Optional target IDs. If omitted, detaches ALL targets.
   * @returns Number of records affected
   * @throws Error if the link is read-only
   */
  public async detach(sourceId: string, targetIds?: string | string[]): Promise<number> {
    this.assertWritable();
    this.assertValidId(sourceId, 'sourceId');

    const ids = targetIds ? (Array.isArray(targetIds) ? targetIds : [targetIds]) : undefined;

    const count = await this.linkService.detach(sourceId, ids);

    // Publish event via PubSub
    this.emit('detached', {
      linkName: this.metadata.name,
      sourceId,
      targetIds: ids,
    });

    return count;
  }

  /**
   * Sync — replace all links for a source with the given target IDs.
   * Publishes `link.<name>.synced` event after successful sync.
   *
   * @param sourceId - The source entity's ID
   * @param targetIds - The complete set of target IDs
   * @param pivotData - Optional extra column values for new records
   * @returns Object with `attached` and `detached` counts
   * @throws Error if the link is read-only
   */
  public async sync(
    sourceId: string,
    targetIds: string[],
    pivotData?: Record<string, any>
  ): Promise<{ attached: number; detached: number }> {
    this.assertWritable();
    this.assertValidId(sourceId, 'sourceId');
    targetIds.forEach((id) => this.assertValidId(id, 'targetId'));

    const result = await this.linkService.sync(sourceId, targetIds, pivotData);

    // Publish event via PubSub
    this.emit('synced', {
      linkName: this.metadata.name,
      sourceId,
      targetIds,
    });

    return result;
  }

  /**
   * Attach multiple targets to a source with per-item pivot data.
   * Single flush — atomic and performant for batch operations.
   * Publishes a single `link.<name>.attached` event for the batch.
   *
   * @param sourceId - The source entity's ID
   * @param items - Array of { targetId, data? } objects
   * @returns Array of created/updated pivot records (serialized)
   */
  public async attachMany(
    sourceId: string,
    items: { targetId: string; data?: Record<string, any> }[]
  ): Promise<any[]> {
    this.assertWritable();
    this.assertValidId(sourceId, 'sourceId');
    items.forEach((item) => this.assertValidId(item.targetId, 'targetId'));

    const records = await this.linkService.attachMany(sourceId, items);
    const serialized = this.serialize(records);

    this.emit('attached', {
      linkName: this.metadata.name,
      sourceId,
      targetIds: items.map((i) => i.targetId),
      records: serialized,
    });

    return serialized;
  }

  /**
   * Detach ALL targets from a source.
   * Convenience alias for `detach(sourceId)` without target IDs.
   * Publishes `link.<name>.detached` event.
   *
   * @param sourceId - The source entity's ID
   * @returns Number of records affected
   */
  public async detachAll(sourceId: string): Promise<number> {
    return this.detach(sourceId);
  }

  // ─── Soft-Delete / Restore ──────────────────────────────────────────────────

  /**
   * Soft-delete pivot records matching the filter.
   * Publishes `link.<name>.detached` event.
   *
   * @param where - Filter conditions
   * @returns Number of records soft-deleted
   */
  public async softDelete(where: Record<string, any>): Promise<number> {
    this.assertWritable();

    const count = await this.linkService.softDelete(where);

    this.emit('detached', {
      linkName: this.metadata.name,
      records: [where],
    });

    return count;
  }

  /**
   * Restore soft-deleted pivot records.
   * Publishes `link.<name>.restored` event.
   *
   * @param where - Filter conditions to match deleted records
   * @returns Number of records restored
   */
  public async restore(where: Record<string, any>): Promise<number> {
    this.assertWritable();

    const count = await this.linkService.restore(where);

    this.emit('restored', {
      linkName: this.metadata.name,
      records: [where],
    });

    return count;
  }

  // ─── Bulk Operations ────────────────────────────────────────────────────────

  /**
   * List orphaned records (where sourceFk is null).
   * Only available when `orphan: true` on the link.
   *
   * @returns Array of serialized orphaned pivot records
   * @throws Error if orphan mode is not enabled
   */
  public async listOrphaned(): Promise<any[]> {
    const records = await this.linkService.listOrphaned();
    return this.serialize(records);
  }

  /**
   * Re-claim orphaned records by assigning them to a source.
   * Only available when `orphan: true` on the link.
   * Publishes `link.<name>.attached` event after successful re-claim.
   *
   * @param sourceId - The source entity's ID to assign orphans to
   * @param targetIds - Target IDs of orphaned records to re-claim
   * @returns Array of re-claimed records (serialized)
   * @throws Error if orphan mode is not enabled
   */
  public async reclaimOrphaned(sourceId: string, targetIds: string[]): Promise<any[]> {
    this.assertWritable();
    this.assertValidId(sourceId, 'sourceId');
    targetIds.forEach((id) => this.assertValidId(id, 'targetId'));

    const records = await this.linkService.reclaimOrphaned(sourceId, targetIds);
    const serialized = this.serialize(records);

    this.emit('attached', {
      linkName: this.metadata.name,
      sourceId,
      targetIds,
      records: serialized,
    });

    return serialized;
  }

  /**
   * Bulk attach — create multiple links in one operation.
   * Publishes a single `link.<name>.attached` event for the batch.
   *
   * @param entries - Array of [sourceId, targetId, pivotData?] tuples
   * @returns Array of created pivot records
   */
  public async bulkAttach(entries: [string, string, Record<string, any>?][]): Promise<any[]> {
    this.assertWritable();

    const records = await this.linkService.bulkAttach(entries);
    const serialized = this.serialize(records);

    this.emit('attached', {
      linkName: this.metadata.name,
      records: serialized,
    });

    return serialized;
  }

  /**
   * Bulk detach — remove multiple specific links in one operation.
   * Publishes a single `link.<name>.detached` event for the batch.
   *
   * @param entries - Array of [sourceId, targetId] tuples
   * @returns Number of records affected
   */
  public async bulkDetach(entries: [string, string][]): Promise<number> {
    this.assertWritable();

    const count = await this.linkService.bulkDetach(entries);

    this.emit('detached', {
      linkName: this.metadata.name,
      records: entries.map(([s, t]) => ({
        [this.metadata.sourceFk]: s,
        [this.metadata.targetFk]: t,
      })),
    });

    return count;
  }

  /**
   * Hard-delete pivot records permanently.
   * Bypasses soft-delete. Use with caution.
   *
   * @param where - Filter conditions
   * @returns Number of records permanently deleted
   */
  public async hardDelete(where: Record<string, any>): Promise<number> {
    this.assertWritable();
    return this.linkService.hardDelete(where);
  }

  // ─── Read Operations ────────────────────────────────────────────────────────

  /**
   * List pivot records with optional filtering and pagination.
   *
   * @param filter - Query options
   * @returns Array of serialized pivot records
   */
  public async list(filter?: ILinkFilter): Promise<any[]> {
    const records = await this.linkService.list(filter);
    return this.serialize(records);
  }

  /**
   * List pivot records with total count (for pagination).
   *
   * @param filter - Query options
   * @returns Tuple of [serialized records, total count]
   */
  public async listAndCount(filter?: ILinkFilter): Promise<[any[], number]> {
    const [records, count] = await this.linkService.listAndCount(filter);
    return [this.serialize(records), count];
  }

  /**
   * List all links for a specific source entity.
   *
   * @param sourceId - The source entity's ID
   * @param filter - Optional additional filters
   * @returns Array of serialized pivot records
   */
  public async listBySource(sourceId: string, filter?: Omit<ILinkFilter, 'where'>): Promise<any[]> {
    const records = await this.linkService.listBySource(sourceId, filter);
    return this.serialize(records);
  }

  /**
   * Batch-load links for multiple source IDs in a single query.
   *
   * Used by DataLoaders to prevent N+1 queries when resolving many-to-many
   * relationships in GraphQL. Returns results grouped by source ID in the
   * same order as the input.
   *
   * @param sourceIds - Array of source entity IDs to load links for
   * @returns Array of arrays — one per source ID, in input order. Each inner
   *          array contains the serialized pivot records for that source.
   *
   * @example
   * ```typescript
   * // DataLoader batch function:
   * const loader = new DataLoader(async (sourceIds) => {
   *   return linkService.listBySourceBatch([...sourceIds]);
   * });
   * ```
   */
  public async listBySourceBatch(sourceIds: readonly string[]): Promise<any[][]> {
    if (sourceIds.length === 0) return [];

    const records = await this.linkService.list({
      where: { [this.metadata.sourceFk]: { $in: [...sourceIds] } },
    });
    const serialized = this.serialize(records);

    // Group by source FK value
    const grouped = new Map<string, any[]>();
    for (const id of sourceIds) {
      grouped.set(id, []);
    }
    for (const record of serialized) {
      const fkValue = String(record[this.metadata.sourceFk]);
      const list = grouped.get(fkValue);
      if (list) {
        list.push(record);
      } else {
        grouped.set(fkValue, [record]);
      }
    }

    // Return in same order as input
    return sourceIds.map((id) => grouped.get(id) ?? []);
  }

  /**
   * Batch-load links for multiple target IDs in a single query.
   *
   * The inverse of `listBySourceBatch` — useful for resolving the target→source
   * direction of a many-to-many relationship.
   *
   * @param targetIds - Array of target entity IDs to load links for
   * @returns Array of arrays — one per target ID, in input order
   */
  public async listByTargetBatch(targetIds: readonly string[]): Promise<any[][]> {
    if (targetIds.length === 0) return [];

    const records = await this.linkService.list({
      where: { [this.metadata.targetFk]: { $in: [...targetIds] } },
    });
    const serialized = this.serialize(records);

    // Group by target FK value
    const grouped = new Map<string, any[]>();
    for (const id of targetIds) {
      grouped.set(id, []);
    }
    for (const record of serialized) {
      const fkValue = String(record[this.metadata.targetFk]);
      const list = grouped.get(fkValue);
      if (list) {
        list.push(record);
      } else {
        grouped.set(fkValue, [record]);
      }
    }

    return targetIds.map((id) => grouped.get(id) ?? []);
  }

  /**
   * List all links for a specific target entity.
   *
   * @param targetId - The target entity's ID
   * @param filter - Optional additional filters
   * @returns Array of serialized pivot records
   */
  public async listByTarget(targetId: string, filter?: Omit<ILinkFilter, 'where'>): Promise<any[]> {
    const records = await this.linkService.listByTarget(targetId, filter);
    return this.serialize(records);
  }

  /**
   * Count links for a source entity.
   *
   * @param sourceId - The source entity's ID
   * @returns Number of active links from this source
   */
  public async countBySource(sourceId: string): Promise<number> {
    return this.linkService.countBySource(sourceId);
  }

  /**
   * Count links for a target entity.
   *
   * @param targetId - The target entity's ID
   * @returns Number of active links to this target
   */
  public async countByTarget(targetId: string): Promise<number> {
    return this.linkService.countByTarget(targetId);
  }

  /**
   * Check if a specific link exists between source and target.
   *
   * @param sourceId - The source entity's ID
   * @param targetId - The target entity's ID
   * @returns true if the link exists (and is not soft-deleted)
   */
  public async exists(sourceId: string, targetId: string): Promise<boolean> {
    return this.linkService.exists(sourceId, targetId);
  }

  /**
   * Find the pivot record for a specific target.
   * For one-to-many links, returns the single assignment record (or null).
   *
   * @param targetId - The target entity's ID
   * @returns The serialized pivot record or null
   */
  public async findByTarget(targetId: string): Promise<any | null> {
    this.assertValidId(targetId, 'targetId');
    const record = await this.linkService.findByTarget(targetId);
    if (!record) return null;
    return this.serialize([record])[0];
  }

  /**
   * Find the specific pivot record between a source and target.
   *
   * @param sourceId - The source entity's ID
   * @param targetId - The target entity's ID
   * @returns The serialized pivot record or null
   */
  public async findBySource(sourceId: string, targetId: string): Promise<any | null> {
    this.assertValidId(sourceId, 'sourceId');
    this.assertValidId(targetId, 'targetId');
    const record = await this.linkService.findBySourceAndTarget(sourceId, targetId);
    if (!record) return null;
    return this.serialize([record])[0];
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Asserts that the link is writable (not read-only).
   * @throws Error if the link is read-only
   */
  private assertWritable(): void {
    if (this.metadata.readOnly) {
      throw new Error(
        `Link "${this.metadata.name}" is read-only. ` +
          `Write operations (attach, detach, sync) are not available on read-only links.`
      );
    }
  }

  /**
   * Validates that an ID is a non-empty string.
   * @throws Error if the ID is invalid
   */
  private assertValidId(id: string, paramName: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`Invalid ${paramName}: expected a non-empty string, got "${id}".`);
    }
  }

  /**
   * Publishes a link event via the @stackra/nestjs-pubsub driver.
   * Silently skips if no PubSub driver is configured.
   *
   * Events are published to channel: `link.<linkName>.<action>`
   * with a standard `IPubSubMessage` envelope (from `@stackra/contracts`).
   */
  private emit(action: string, data: ILinkEventData): void {
    if (!this.pubsub) return;

    const channel = `link.${this.metadata.name}.${action}`;
    const message: IPubSubMessage<ILinkEventData> = {
      event: channel,
      data,
      metadata: {
        source: '@stackra/nestjs-link',
        timestamp: new Date(),
      },
    };

    this.pubsub.publish(channel, message).catch((error: Error) => {
      // Don't let event emission failures break the operation
      this.logger.warn(`Failed to publish event "${channel}": ${error.message}`);
    });
  }

  /**
   * Serializes MikroORM entities to plain objects.
   * Strips internal MikroORM metadata and proxy wrappers.
   */
  private serialize(records: any[]): any[] {
    return records.map((record) => {
      if (!record) return record;

      // If it's already a plain object, return as-is
      if (record.constructor === Object) return record;

      // Extract own enumerable properties (strips MikroORM internals)
      const plain: Record<string, any> = {};
      for (const key of Object.keys(record)) {
        if (!key.startsWith('__')) {
          plain[key] = record[key];
        }
      }
      return plain;
    });
  }
}
