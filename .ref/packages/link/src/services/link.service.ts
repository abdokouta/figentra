/**
 * @file link.service.ts
 * @module @stackra/nestjs-link/services
 * @description Low-level service for managing pivot table records.
 *
 * `LinkService` operates directly on a single link's pivot table via
 * MikroORM's EntityManager. It provides the fundamental CRUD operations:
 * - `attach` — create pivot records (link entities together)
 * - `detach` — remove pivot records (unlink entities)
 * - `sync` — replace all links for a source with a new set
 * - `list` / `listAndCount` — query pivot records with filters
 * - `softDelete` / `restore` — mark/unmark records as deleted
 *
 * ## Design Decisions
 * - One `LinkService` instance per link definition (scoped by metadata)
 * - Uses MikroORM's EntityManager directly (no repository abstraction)
 * - Handles ID generation (UUID with optional prefix)
 * - Respects soft-delete filters automatically
 * - Does NOT emit events (that's `LinkModuleService`'s job)
 *
 * ## Relationship to LinkModuleService
 * `LinkService` is the low-level data layer. `LinkModuleService` wraps it
 * with event emission, validation, and serialization. Most consumers should
 * use `LinkModuleService` — `LinkService` is for internal use or advanced cases.
 *
 * @example
 * ```typescript
 * // Direct usage (advanced — prefer LinkModuleService)
 * @InjectLink('RolePermission')
 * private readonly rolePermLink: LinkService;
 *
 * await rolePermLink.attach(roleId, [permId1, permId2]);
 * await rolePermLink.detach(roleId, [permId1]);
 * const records = await rolePermLink.listBySource(roleId);
 * ```
 */

import { IInjectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { randomUUID } from 'crypto';
import type { ILinkMetadata } from '../interfaces/link-metadata.interface';
import type { ILinkFilter } from '../interfaces/link-filter.interface';

/**
 * LinkService — manages records in a link's pivot table.
 *
 * One instance is created per link definition during module initialization.
 * Injected via the link's DI token (e.g., `LINK_SERVICE_RolePermission`).
 */
@IInjectable()
export class LinkService {
  constructor(
    private readonly em: EntityManager,
    private readonly metadata: ILinkMetadata
  ) {}

  // ─── Accessors ──────────────────────────────────────────────────────────────

  /** The unique link name (e.g., 'RolePermission'). */
  get name(): string {
    return this.metadata.name;
  }

  /** The pivot table name. */
  get table(): string {
    return this.metadata.table;
  }

  /** The entity name used in MikroORM queries. */
  private get entityName(): string {
    return `Link_${this.metadata.name}`;
  }

  // ─── Write Operations ───────────────────────────────────────────────────────

  /**
   * Attach target entities to a source entity.
   * Creates pivot records linking the source to each target.
   *
   * If a link already exists (and soft-deletes are enabled), it will be
   * restored instead of creating a duplicate.
   *
   * For `one-to-many` cardinality: enforces that each target belongs to at
   * most one source. Behavior on conflict is controlled by `onConflict`:
   * - `'error'`: throws if target is already linked to a different source
   * - `'reassign'`: silently moves the target to the new source
   * - `'skip'`: silently skips targets already assigned elsewhere
   *
   * For `one-to-many` with `orphan: true`: re-claims orphaned records
   * (where sourceFk is null) by updating the FK instead of creating new records.
   *
   * @param sourceId - The source entity's ID
   * @param targetIds - One or more target entity IDs to link
   * @param pivotData - Optional extra column values for the pivot records
   * @returns Array of created/restored pivot records
   */
  public async attach(
    sourceId: string,
    targetIds: string | string[],
    pivotData?: Record<string, any>
  ): Promise<any[]> {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    const created: any[] = [];
    const isOneToMany =
      this.metadata.cardinality === 'one-to-many' || this.metadata.cardinality === 'one-to-one';

    for (const targetId of ids) {
      // ─── One-to-many: check for existing assignment ─────────────────────
      if (isOneToMany) {
        const existing = await this.em.findOne(
          this.entityName as any,
          { [this.metadata.targetFk]: targetId } as FilterQuery<any>,
          this.metadata.softDeletes ? { filters: { softDelete: false } } : undefined
        );

        if (existing) {
          const currentSourceId = (existing as any)[this.metadata.sourceFk];

          // Already linked to the same source — no-op (idempotent)
          if (currentSourceId === sourceId) {
            // Restore if soft-deleted
            if (this.metadata.softDeletes && (existing as any).deleted_at) {
              (existing as any).deleted_at = null;
            }
            if (pivotData) Object.assign(existing, pivotData);
            created.push(existing);
            continue;
          }

          // Orphaned record (sourceFk is null) — re-claim it
          if (currentSourceId == null && this.metadata.orphan) {
            (existing as any)[this.metadata.sourceFk] = sourceId;
            if (this.metadata.softDeletes && (existing as any).deleted_at) {
              (existing as any).deleted_at = null;
            }
            if (pivotData) Object.assign(existing, pivotData);
            created.push(existing);
            continue;
          }

          // Conflict: target is linked to a different source
          if (currentSourceId != null && currentSourceId !== sourceId) {
            switch (this.metadata.onConflict) {
              case 'reassign':
                (existing as any)[this.metadata.sourceFk] = sourceId;
                if (pivotData) Object.assign(existing, pivotData);
                created.push(existing);
                continue;

              case 'skip':
                continue;

              case 'error':
              default:
                throw new Error(
                  `Link "${this.metadata.name}": target "${targetId}" is already ` +
                    `linked to source "${currentSourceId}". Cannot attach to "${sourceId}".`
                );
            }
          }
        }
      }

      // ─── Many-to-many: check for soft-deleted record to restore ─────────
      if (!isOneToMany && this.metadata.softDeletes) {
        const existing = await this.em.findOne(
          this.entityName as any,
          {
            [this.metadata.sourceFk]: sourceId,
            [this.metadata.targetFk]: targetId,
          } as FilterQuery<any>,
          { filters: { softDelete: false } }
        );

        if (existing) {
          (existing as any).deleted_at = null;
          if (pivotData) Object.assign(existing, pivotData);
          created.push(existing);
          continue;
        }
      }

      // ─── Create a new pivot record ──────────────────────────────────────
      const record = this.em.create(
        this.entityName as any,
        {
          id: randomUUID(),
          [this.metadata.sourceFk]: sourceId,
          [this.metadata.targetFk]: targetId,
          ...(pivotData || {}),
        } as any
      );

      created.push(record);
    }

    await this.em.flush();
    return created;
  }

  /**
   * Detach target entities from a source entity.
   *
   * Behavior depends on link configuration:
   * - `orphan: true` (one-to-many): Sets sourceFk to null (record persists as orphaned)
   * - `softDeletes: true`: Marks records as deleted (sets `deleted_at`)
   * - Otherwise: Permanently removes the records
   *
   * @param sourceId - The source entity's ID
   * @param targetIds - Optional target IDs to detach. If omitted, detaches ALL targets.
   * @returns Number of records affected
   */
  public async detach(sourceId: string, targetIds?: string | string[]): Promise<number> {
    const where: any = { [this.metadata.sourceFk]: sourceId };

    if (targetIds) {
      const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
      where[this.metadata.targetFk] = { $in: ids };
    }

    const records = await this.em.find(this.entityName as any, where as FilterQuery<any>);

    if (records.length === 0) return 0;

    // ─── Orphan mode: set sourceFk to null (record persists) ──────────────
    if (this.metadata.orphan) {
      for (const record of records) {
        (record as any)[this.metadata.sourceFk] = null;
      }
      await this.em.flush();
      return records.length;
    }

    // ─── Soft-delete mode: set deleted_at timestamp ───────────────────────
    if (this.metadata.softDeletes) {
      for (const record of records) {
        (record as any).deleted_at = new Date();
      }
      await this.em.flush();
      return records.length;
    }

    // ─── Hard-delete mode: remove records permanently ─────────────────────
    return await this.em.nativeDelete(this.entityName as any, where as FilterQuery<any>);
  }

  /**
   * Sync — replaces all links for a source with the given target IDs.
   *
   * This is an atomic "set" operation:
   * 1. Detaches all current targets not in the new set
   * 2. Attaches all new targets not currently linked
   * 3. Leaves existing links that are in both sets untouched
   *
   * @param sourceId - The source entity's ID
   * @param targetIds - The complete set of target IDs that should be linked
   * @param pivotData - Optional extra column values for newly created records
   * @returns Object with `attached` and `detached` counts
   *
   * @example
   * ```typescript
   * // Set role's permissions to exactly these three
   * await linkService.sync(roleId, [permId1, permId2, permId3]);
   * ```
   */
  public async sync(
    sourceId: string,
    targetIds: string[],
    pivotData?: Record<string, any>
  ): Promise<{ attached: number; detached: number }> {
    // Get current links
    const currentRecords = await this.em.find(
      this.entityName as any,
      { [this.metadata.sourceFk]: sourceId } as FilterQuery<any>
    );
    const currentTargetIds = currentRecords.map((r: any) => r[this.metadata.targetFk]);

    // Determine what to add and remove
    const toAttach = targetIds.filter((id) => !currentTargetIds.includes(id));
    const toDetach = currentTargetIds.filter((id) => !targetIds.includes(id));

    // Execute changes
    if (toDetach.length > 0) {
      await this.detach(sourceId, toDetach);
    }
    if (toAttach.length > 0) {
      await this.attach(sourceId, toAttach, pivotData);
    }

    return { attached: toAttach.length, detached: toDetach.length };
  }

  // ─── Soft-Delete / Restore ──────────────────────────────────────────────────

  /**
   * Soft-delete pivot records matching the given filter.
   * Only available when `softDeletes: true` on the link.
   *
   * @param where - Filter conditions to match records
   * @returns Number of records soft-deleted
   * @throws Error if soft-deletes are not enabled on this link
   */
  public async softDelete(where: Record<string, any>): Promise<number> {
    if (!this.metadata.softDeletes) {
      throw new Error(
        `Link "${this.metadata.name}" does not have soft-deletes enabled. ` +
          `Use detach() for hard-delete or enable softDeletes in defineLink().`
      );
    }

    const records = await this.em.find(this.entityName as any, where as FilterQuery<any>);
    for (const record of records) {
      (record as any).deleted_at = new Date();
    }
    await this.em.flush();
    return records.length;
  }

  /**
   * Restore soft-deleted pivot records matching the given filter.
   * Only available when `softDeletes: true` on the link.
   *
   * @param where - Filter conditions to match deleted records
   * @returns Number of records restored
   * @throws Error if soft-deletes are not enabled on this link
   */
  public async restore(where: Record<string, any>): Promise<number> {
    if (!this.metadata.softDeletes) {
      throw new Error(`Link "${this.metadata.name}" does not have soft-deletes enabled.`);
    }

    // Query with soft-delete filter disabled to find deleted records
    const records = await this.em.find(
      this.entityName as any,
      { ...where, deleted_at: { $ne: null } } as FilterQuery<any>,
      { filters: { softDelete: false } }
    );

    for (const record of records) {
      (record as any).deleted_at = null;
    }
    await this.em.flush();
    return records.length;
  }

  // ─── Read Operations ────────────────────────────────────────────────────────

  /**
   * List pivot records with optional filtering, ordering, and pagination.
   *
   * @param filter - Query options (where, orderBy, limit, offset, withDeleted)
   * @returns Array of pivot records
   *
   * @example
   * ```typescript
   * const records = await linkService.list({
   *   where: { role_id: roleId },
   *   orderBy: { created_at: 'DESC' },
   *   limit: 10,
   * });
   * ```
   */
  public async list(filter?: ILinkFilter): Promise<any[]> {
    const findOptions = this.buildFindOptions(filter);
    return await this.em.find(
      this.entityName as any,
      (filter?.where || {}) as FilterQuery<any>,
      findOptions
    );
  }

  /**
   * List pivot records with count (for pagination).
   *
   * @param filter - Query options
   * @returns Tuple of [records, totalCount]
   */
  public async listAndCount(filter?: ILinkFilter): Promise<[any[], number]> {
    const findOptions = this.buildFindOptions(filter);
    return await this.em.findAndCount(
      this.entityName as any,
      (filter?.where || {}) as FilterQuery<any>,
      findOptions
    );
  }

  /**
   * List all links for a specific source entity.
   *
   * @param sourceId - The source entity's ID
   * @param filter - Optional additional filters
   * @returns Array of pivot records for this source
   */
  public async listBySource(sourceId: string, filter?: Omit<ILinkFilter, 'where'>): Promise<any[]> {
    return this.list({
      ...filter,
      where: { [this.metadata.sourceFk]: sourceId },
    });
  }

  /**
   * List all links for a specific target entity.
   *
   * @param targetId - The target entity's ID
   * @param filter - Optional additional filters
   * @returns Array of pivot records for this target
   */
  public async listByTarget(targetId: string, filter?: Omit<ILinkFilter, 'where'>): Promise<any[]> {
    return this.list({
      ...filter,
      where: { [this.metadata.targetFk]: targetId },
    });
  }

  /**
   * Count links for a specific source entity.
   *
   * @param sourceId - The source entity's ID
   * @returns Number of active links from this source
   */
  public async countBySource(sourceId: string): Promise<number> {
    return await this.em.count(
      this.entityName as any,
      { [this.metadata.sourceFk]: sourceId } as FilterQuery<any>
    );
  }

  /**
   * Count links for a specific target entity.
   *
   * @param targetId - The target entity's ID
   * @returns Number of active links to this target
   */
  public async countByTarget(targetId: string): Promise<number> {
    return await this.em.count(
      this.entityName as any,
      { [this.metadata.targetFk]: targetId } as FilterQuery<any>
    );
  }

  /**
   * Check if a specific link exists between source and target.
   *
   * @param sourceId - The source entity's ID
   * @param targetId - The target entity's ID
   * @returns true if the link exists (and is not soft-deleted)
   */
  public async exists(sourceId: string, targetId: string): Promise<boolean> {
    const count = await this.em.count(
      this.entityName as any,
      {
        [this.metadata.sourceFk]: sourceId,
        [this.metadata.targetFk]: targetId,
      } as FilterQuery<any>
    );
    return count > 0;
  }

  /**
   * Find the pivot record for a specific target entity.
   * For one-to-many links, returns the single record (or null if not linked/orphaned).
   *
   * @param targetId - The target entity's ID
   * @returns The pivot record or null if not found
   */
  public async findByTarget(targetId: string): Promise<any | null> {
    return this.em.findOne(this.entityName as any, { [this.metadata.targetFk]: targetId } as any);
  }

  /**
   * Find the specific pivot record between a source and target.
   *
   * @param sourceId - The source entity's ID
   * @param targetId - The target entity's ID
   * @returns The pivot record or null if not found
   */
  public async findBySourceAndTarget(sourceId: string, targetId: string): Promise<any | null> {
    return this.em.findOne(
      this.entityName as any,
      {
        [this.metadata.sourceFk]: sourceId,
        [this.metadata.targetFk]: targetId,
      } as any
    );
  }

  /**
   * Attach multiple targets to a source with per-item pivot data in a single flush.
   *
   * Unlike calling `attach()` in a loop (which flushes per call), this method
   * batches all creates/updates into a single `em.flush()` for atomicity and performance.
   *
   * @param sourceId - The source entity's ID
   * @param items - Array of { targetId, data? } objects
   * @returns Array of created/updated pivot records
   */
  public async attachMany(
    sourceId: string,
    items: { targetId: string; data?: Record<string, any> }[]
  ): Promise<any[]> {
    if (!items.length) return [];

    const created: any[] = [];
    const isOneToMany =
      this.metadata.cardinality === 'one-to-many' || this.metadata.cardinality === 'one-to-one';

    for (const { targetId, data } of items) {
      // ─── One-to-many: check for existing assignment ─────────────────────
      if (isOneToMany) {
        const existing = await this.em.findOne(
          this.entityName as any,
          { [this.metadata.targetFk]: targetId } as any,
          this.metadata.softDeletes ? { filters: { softDelete: false } } : undefined
        );

        if (existing) {
          const currentSourceId = (existing as any)[this.metadata.sourceFk];

          if (currentSourceId === sourceId) {
            if (this.metadata.softDeletes && (existing as any).deleted_at) {
              (existing as any).deleted_at = null;
            }
            if (data) Object.assign(existing, data);
            created.push(existing);
            continue;
          }

          if (currentSourceId == null && this.metadata.orphan) {
            (existing as any)[this.metadata.sourceFk] = sourceId;
            if (this.metadata.softDeletes && (existing as any).deleted_at) {
              (existing as any).deleted_at = null;
            }
            if (data) Object.assign(existing, data);
            created.push(existing);
            continue;
          }

          if (currentSourceId != null && currentSourceId !== sourceId) {
            switch (this.metadata.onConflict) {
              case 'reassign':
                (existing as any)[this.metadata.sourceFk] = sourceId;
                if (data) Object.assign(existing, data);
                created.push(existing);
                continue;
              case 'skip':
                continue;
              case 'error':
              default:
                throw new Error(
                  `Link "${this.metadata.name}": target "${targetId}" is already ` +
                    `linked to source "${currentSourceId}". Cannot attach to "${sourceId}".`
                );
            }
          }
        }
      }

      // ─── Many-to-many: check for soft-deleted record to restore ─────────
      if (!isOneToMany && this.metadata.softDeletes) {
        const existing = await this.em.findOne(
          this.entityName as any,
          {
            [this.metadata.sourceFk]: sourceId,
            [this.metadata.targetFk]: targetId,
          } as any,
          { filters: { softDelete: false } }
        );

        if (existing) {
          (existing as any).deleted_at = null;
          if (data) Object.assign(existing, data);
          created.push(existing);
          continue;
        }
      }

      // ─── Create a new pivot record ──────────────────────────────────────
      const record = this.em.create(
        this.entityName as any,
        {
          id: randomUUID(),
          [this.metadata.sourceFk]: sourceId,
          [this.metadata.targetFk]: targetId,
          ...(data || {}),
        } as any
      );
      created.push(record);
    }

    // Single flush for all operations — atomic
    await this.em.flush();
    return created;
  }

  // ─── Bulk Operations ────────────────────────────────────────────────────────

  /**
   * List orphaned records (where sourceFk is null).
   * Only available when `orphan: true` on the link.
   *
   * @param filter - Optional additional filters
   * @returns Array of orphaned pivot records
   * @throws Error if orphan mode is not enabled
   */
  public async listOrphaned(filter?: Omit<ILinkFilter, 'where'>): Promise<any[]> {
    if (!this.metadata.orphan) {
      throw new Error(
        `Link "${this.metadata.name}" does not have orphan mode enabled. ` +
          `Set 'orphan: true' in defineLink() to use this method.`
      );
    }

    return this.list({
      ...filter,
      where: { [this.metadata.sourceFk]: null },
    });
  }

  /**
   * Re-claim orphaned records by assigning them to a source.
   * Only available when `orphan: true` on the link.
   *
   * Finds orphaned records matching the given target IDs and sets their
   * sourceFk to the specified source ID.
   *
   * @param sourceId - The source entity's ID to assign orphans to
   * @param targetIds - Target IDs of orphaned records to re-claim
   * @returns Array of re-claimed records
   * @throws Error if orphan mode is not enabled
   */
  public async reclaimOrphaned(sourceId: string, targetIds: string[]): Promise<any[]> {
    if (!this.metadata.orphan) {
      throw new Error(`Link "${this.metadata.name}" does not have orphan mode enabled.`);
    }

    const records = await this.em.find(
      this.entityName as any,
      {
        [this.metadata.targetFk]: { $in: targetIds },
        [this.metadata.sourceFk]: null,
      } as FilterQuery<any>
    );

    for (const record of records) {
      (record as any)[this.metadata.sourceFk] = sourceId;
    }

    await this.em.flush();
    return records;
  }

  // ─── Bulk Operations (continued) ───────────────────────────────────────────

  /**
   * Bulk attach — create multiple links in one operation.
   * Each entry is a [sourceId, targetId, pivotData?] tuple.
   *
   * @param entries - Array of [sourceId, targetId, pivotData?] tuples
   * @returns Array of created pivot records
   *
   * @example
   * ```typescript
   * await linkService.bulkAttach([
   *   [roleId1, permId1],
   *   [roleId1, permId2, { sort_order: 1 }],
   *   [roleId2, permId1],
   * ]);
   * ```
   */
  public async bulkAttach(entries: [string, string, Record<string, any>?][]): Promise<any[]> {
    const created: any[] = [];

    for (const [sourceId, targetId, pivotData] of entries) {
      const record = this.em.create(
        this.entityName as any,
        {
          id: randomUUID(),
          [this.metadata.sourceFk]: sourceId,
          [this.metadata.targetFk]: targetId,
          ...(pivotData || {}),
        } as any
      );
      created.push(record);
    }

    await this.em.flush();
    return created;
  }

  /**
   * Bulk detach — remove multiple specific links in one operation.
   *
   * @param entries - Array of [sourceId, targetId] tuples to remove
   * @returns Number of records affected
   */
  public async bulkDetach(entries: [string, string][]): Promise<number> {
    if (entries.length === 0) return 0;

    const orConditions = entries.map(([sourceId, targetId]) => ({
      [this.metadata.sourceFk]: sourceId,
      [this.metadata.targetFk]: targetId,
    }));

    const where = { $or: orConditions } as FilterQuery<any>;

    if (this.metadata.softDeletes) {
      const records = await this.em.find(this.entityName as any, where);
      for (const record of records) {
        (record as any).deleted_at = new Date();
      }
      await this.em.flush();
      return records.length;
    } else {
      return await this.em.nativeDelete(this.entityName as any, where);
    }
  }

  /**
   * Hard-delete pivot records permanently, bypassing soft-delete.
   * Use with caution — this cannot be undone.
   *
   * @param where - Filter conditions to match records
   * @returns Number of records permanently deleted
   */
  public async hardDelete(where: Record<string, any>): Promise<number> {
    return await this.em.nativeDelete(this.entityName as any, where as FilterQuery<any>);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Builds MikroORM find options from our LinkFilter interface.
   */
  private buildFindOptions(filter?: ILinkFilter): Record<string, any> {
    const options: Record<string, any> = {};

    if (filter?.orderBy) {
      options.orderBy = filter.orderBy;
    }

    if (filter?.limit !== undefined) {
      options.limit = filter.limit;
    }

    if (filter?.offset !== undefined) {
      options.offset = filter.offset;
    }

    // Disable soft-delete filter if withDeleted is true
    if (filter?.withDeleted && this.metadata.softDeletes) {
      options.filters = { softDelete: false };
    }

    return options;
  }
}
