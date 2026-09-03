/**
 * @file lifecycle.decorator.ts
 * @module @stackra/nestjs-orm/decorators
 * @description Entity lifecycle decorators that register methods to be invoked
 *   at specific points in the entity persistence lifecycle.
 *   Hooks are triggered by the LifecycleHooksSubscriber (MikroORM EventSubscriber).
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Metadata Key
// ============================================================================

// ============================================================================
// Internal Helper
// ============================================================================

/**
 * Register a method as a lifecycle hook for a given event.
 *
 * @param event - The lifecycle event to hook into
 * @returns Method decorator
 */
function registerLifecycle(event: LifecycleEvent): MethodDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const constructor = target.constructor;
    const existing: Map<LifecycleEvent, string[]> =
      getMetadata<Map<LifecycleEvent, string[]>>(LIFECYCLE_METADATA, constructor) ||
      new Map<LifecycleEvent, string[]>();

    // Clone the map to avoid mutating shared metadata
    const hooks = new Map(existing);
    const methods = [...(hooks.get(event) || [])];
    methods.push(String(propertyKey));
    hooks.set(event, methods);

    defineMetadata(LIFECYCLE_METADATA, hooks, constructor);
  };
}

// ============================================================================
// Decorators
// ============================================================================

/**
 * Invoke the decorated method before the entity is persisted for the first time.
 *
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @Entity({ tableName: 'products' })
 * export class Product extends BaseEntity {
 *   @BeforeCreate()
 *   generateSlug(): void {
 *     this.slug = Str.kebab(this.name);
 *   }
 * }
 * ```
 */
export function BeforeCreate(): MethodDecorator {
  return registerLifecycle('beforeCreate');
}

/**
 * Invoke the decorated method after the entity is successfully persisted for the first time.
 *
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @Entity({ tableName: 'users' })
 * export class User extends BaseEntity {
 *   @AfterCreate()
 *   sendWelcomeEmail(): void {
 *     // Triggered after the user is saved to the database
 *   }
 * }
 * ```
 */
export function AfterCreate(): MethodDecorator {
  return registerLifecycle('afterCreate');
}

/**
 * Invoke the decorated method before changed fields are flushed to the database.
 *
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @Entity({ tableName: 'products' })
 * export class Product extends BaseEntity {
 *   @BeforeUpdate()
 *   updateSlug(): void {
 *     if (this.name !== this.__original?.name) {
 *       this.slug = Str.kebab(this.name);
 *     }
 *   }
 * }
 * ```
 */
export function BeforeUpdate(): MethodDecorator {
  return registerLifecycle('beforeUpdate');
}

/**
 * Invoke the decorated method after changed fields are successfully flushed.
 *
 * @returns Method decorator
 */
export function AfterUpdate(): MethodDecorator {
  return registerLifecycle('afterUpdate');
}

/**
 * Invoke the decorated method before the entity is removed (soft-delete or force-delete).
 *
 * @returns Method decorator
 */
export function BeforeDelete(): MethodDecorator {
  return registerLifecycle('beforeDelete');
}

/**
 * Invoke the decorated method after the entity is successfully removed.
 *
 * @returns Method decorator
 */
export function AfterDelete(): MethodDecorator {
  return registerLifecycle('afterDelete');
}

// ============================================================================
// Metadata Reader
// ============================================================================

/**
 * Read lifecycle hook registrations from an entity class.
 *
 * @param entityClass - The entity class constructor
 * @returns Map of lifecycle event → array of method names (empty map if none)
 */
export function getLifecycleHooks(entityClass: Function): Map<LifecycleEvent, string[]> {
  return getMetadata<Map<LifecycleEvent, string[]>>(LIFECYCLE_METADATA, entityClass) || new Map();
}
