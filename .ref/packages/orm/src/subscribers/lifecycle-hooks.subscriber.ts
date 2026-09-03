/**
 * @file lifecycle-hooks.subscriber.ts
 * @module @stackra/nestjs-orm/subscribers
 * @description MikroORM EventSubscriber that bridges entity lifecycle decorators
 *   (@BeforeCreate, @AfterCreate, etc.) to MikroORM's event system.
 *   Also handles trait-level hooks: @Sluggable(), @Encrypted(), @Auditable().
 */

import type { EventArgs, EventSubscriber, FlushEventArgs } from '@mikro-orm/core';

import { getMetadata } from '@vivtel/metadata';
import { getLifecycleHooks, type LifecycleEvent } from '../decorators/lifecycle.decorator';
import { generateSlug } from '../decorators/traits/sluggable.decorator';
import type { ISluggableConfig } from '../decorators/traits/sluggable.decorator';
import type { IEncryptedConfig } from '../decorators/traits/encrypted.decorator';
import type { IAuditableConfig } from '../decorators/traits/auditable.decorator';

// ============================================================================
// Subscriber
// ============================================================================

/**
 * MikroORM event subscriber that invokes entity lifecycle hook methods.
 *
 * Listens to all create/update/delete events and reads the `LIFECYCLE_METADATA`
 * from each entity's class to determine which methods to invoke. Methods are
 * called in registration order (top-to-bottom in the entity class).
 *
 * Additionally handles trait-level concerns:
 * - @Sluggable() — generates slug on beforeCreate
 * - @Encrypted() — encrypts fields on beforeCreate/beforeUpdate, decrypts on onLoad
 * - @Auditable() — emits audit events on afterUpdate/afterDelete
 *
 * Registered globally in `OrmModule.forRoot()` as a MikroORM subscriber.
 *
 * @example
 * ```typescript
 * // In OrmModule.forRoot() config:
 * MikroOrmModule.forRoot({
 *   subscribers: [new LifecycleHooksSubscriber()],
 * });
 * ```
 */
export class LifecycleHooksSubscriber implements EventSubscriber {
  /**
   * Invoked before a new entity is persisted.
   *
   * @param args - MikroORM event args containing the entity
   */
  public async beforeCreate(args: EventArgs<any>): Promise<void> {
    const entity = args.entity;

    this.handleSluggable(entity);
    this.handleEncryptBeforeWrite(entity);

    await this.invokeHooks(entity, 'beforeCreate');
  }

  /**
   * Invoked after a new entity is successfully persisted.
   *
   * @param args - MikroORM event args containing the entity
   */
  public async afterCreate(args: EventArgs<any>): Promise<void> {
    await this.invokeHooks(args.entity, 'afterCreate');
  }

  /**
   * Invoked before an existing entity's changes are flushed.
   *
   * @param args - MikroORM event args containing the entity
   */
  public async beforeUpdate(args: EventArgs<any>): Promise<void> {
    this.handleEncryptBeforeWrite(args.entity);

    await this.invokeHooks(args.entity, 'beforeUpdate');
  }

  /**
   * Invoked after an existing entity's changes are successfully flushed.
   *
   * @param args - MikroORM event args containing the entity and changeSet
   */
  public async afterUpdate(args: EventArgs<any>): Promise<void> {
    this.handleAuditableAfterUpdate(args);

    await this.invokeHooks(args.entity, 'afterUpdate');
  }

  /**
   * Invoked before an entity is removed from the database.
   *
   * @param args - MikroORM event args containing the entity
   */
  public async beforeDelete(args: EventArgs<any>): Promise<void> {
    await this.invokeHooks(args.entity, 'beforeDelete');
  }

  /**
   * Invoked after an entity is successfully removed from the database.
   *
   * @param args - MikroORM event args containing the entity
   */
  public async afterDelete(args: EventArgs<any>): Promise<void> {
    this.handleAuditableAfterDelete(args);

    await this.invokeHooks(args.entity, 'afterDelete');
  }

  /**
   * Invoked when an entity is loaded from the database.
   * Handles field decryption for @Encrypted() trait.
   *
   * @param args - MikroORM event args containing the entity
   */
  public async onLoad(args: EventArgs<any>): Promise<void> {
    this.handleDecryptAfterLoad(args.entity);
  }

  /**
   * No-op on successful flush — included for EventSubscriber interface completeness.
   *
   * @param _args - MikroORM flush event args
   */
  public async afterFlush(_args: FlushEventArgs): Promise<void> {
    // No-op
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sluggable
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate slug from source field(s) if @Sluggable() metadata is present.
   *
   * @param entity - The entity instance being created
   */
  private handleSluggable(entity: any): void {
    if (!entity || !entity.constructor) return;

    const config = getMetadata<Required<ISluggableConfig>>(
      'stackra:orm:sluggable',
      entity.constructor
    );
    if (!config) return;

    // Only generate if the slug field is not already set
    if (entity[config.field]) return;

    const fields = Array.isArray(config.from) ? config.from : [config.from];
    const sourceValue = fields.map((f: string) => entity[f] || '').join(' ');

    if (sourceValue.trim()) {
      entity[config.field] = generateSlug(sourceValue, config.separator);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Encrypted
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Encrypt fields before persisting (create or update).
   *
   * @param entity - The entity instance being written
   */
  private handleEncryptBeforeWrite(entity: any): void {
    if (!entity || !entity.constructor) return;

    const config = getMetadata<Required<IEncryptedConfig>>(
      'stackra:orm:encrypted',
      entity.constructor
    );
    if (!config) return;

    const encryptionService = (globalThis as any).__ENCRYPTION_SERVICE__;
    if (!encryptionService) return;

    for (const field of config.fields) {
      if (entity[field]) {
        entity[field] = encryptionService.encrypt(entity[field]);
      }
    }
  }

  /**
   * Decrypt fields after loading from the database.
   *
   * @param entity - The entity instance that was loaded
   */
  private handleDecryptAfterLoad(entity: any): void {
    if (!entity || !entity.constructor) return;

    const config = getMetadata<Required<IEncryptedConfig>>(
      'stackra:orm:encrypted',
      entity.constructor
    );
    if (!config) return;

    const encryptionService = (globalThis as any).__ENCRYPTION_SERVICE__;
    if (!encryptionService) return;

    for (const field of config.fields) {
      if (entity[field]) {
        entity[field] = encryptionService.decrypt(entity[field]);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Auditable
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Emit audit event after entity update with change diff.
   *
   * @param args - MikroORM event args with changeSet
   */
  private handleAuditableAfterUpdate(args: EventArgs<any>): void {
    const entity = args.entity;
    if (!entity || !entity.constructor) return;

    const config = getMetadata<Required<IAuditableConfig>>(
      'stackra:orm:auditable',
      entity.constructor
    );
    if (!config || !config.logUpdates) return;

    const pubsub = (globalThis as any).__PUBSUB_SERVICE__;
    if (!pubsub) return;

    // Compute changes from the MikroORM changeSet
    const changeSet = (args as any).changeSet;
    const changes: Record<string, { from: any; to: any }> = {};

    if (changeSet?.payload) {
      const excludeSet = new Set(config.exclude);

      for (const [key, value] of Object.entries(changeSet.payload)) {
        if (excludeSet.has(key)) continue;
        changes[key] = {
          from: changeSet.originalEntity?.[key],
          to: value,
        };
      }
    }

    // Skip if no auditable changes
    if (Object.keys(changes).length === 0) return;

    const entityName = entity.constructor.name.toLowerCase();
    const entityId = entity.id;
    const actorId = (globalThis as any).__CURRENT_ACTOR_ID__ || null;

    pubsub
      .publish(`${entityName}.audit.updated`, {
        entityId,
        entityType: entityName,
        action: 'updated',
        changes,
        actorId,
      })
      .catch(() => {
        // Fail open — audit emission must never break the operation
      });
  }

  /**
   * Emit audit event after entity deletion with final snapshot.
   *
   * @param args - MikroORM event args containing the entity
   */
  private handleAuditableAfterDelete(args: EventArgs<any>): void {
    const entity = args.entity;
    if (!entity || !entity.constructor) return;

    const config = getMetadata<Required<IAuditableConfig>>(
      'stackra:orm:auditable',
      entity.constructor
    );
    if (!config || !config.logDeletes) return;

    const pubsub = (globalThis as any).__PUBSUB_SERVICE__;
    if (!pubsub) return;

    const entityName = entity.constructor.name.toLowerCase();
    const entityId = entity.id;
    const actorId = (globalThis as any).__CURRENT_ACTOR_ID__ || null;
    const excludeSet = new Set(config.exclude);

    // Build snapshot excluding sensitive fields
    const snapshot: Record<string, any> = {};
    for (const key of Object.keys(entity)) {
      if (excludeSet.has(key)) continue;
      if (key.startsWith('__')) continue; // skip MikroORM internals
      snapshot[key] = entity[key];
    }

    pubsub
      .publish(`${entityName}.audit.deleted`, {
        entityId,
        entityType: entityName,
        action: 'deleted',
        changes: snapshot,
        actorId,
      })
      .catch(() => {
        // Fail open — audit emission must never break the operation
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle Hooks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Read lifecycle metadata from the entity class and invoke all registered methods.
   *
   * @param entity - The entity instance
   * @param event - The lifecycle event being processed
   */
  private async invokeHooks(entity: any, event: LifecycleEvent): Promise<void> {
    if (!entity || !entity.constructor) return;

    const hooks = getLifecycleHooks(entity.constructor);
    if (!hooks || hooks.size === 0) return;

    const methods = hooks.get(event);
    if (!methods || methods.length === 0) return;

    for (const methodName of methods) {
      if (typeof entity[methodName] === 'function') {
        await entity[methodName]();
      }
    }
  }
}
