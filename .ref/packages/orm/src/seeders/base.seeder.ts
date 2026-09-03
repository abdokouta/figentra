import { Seeder } from '@mikro-orm/seeder';
import type { Dictionary, EntityManager } from '@mikro-orm/core';

/**
 * Base Seeder Class
 *
 * Extends MikroORM's Seeder class to provide a foundation for database seeders.
 * Seeders populate the database with initial, test, or development data.
 *
 * This base class provides:
 * - Direct access to MikroORM's EntityManager via the `run()` method
 * - Ability to call other seeders via inherited `call()` method
 * - Support for seeding context/configuration via optional context parameter
 * - All MikroORM seeding functionality from parent class
 *
 * @template T - Optional context type for passing configuration to seeders (extends Dictionary)
 *
 * @see https://mikro-orm.io/docs/seeding
 *
 * @example
 * ```typescript
 * // Simple seeder with direct entity creation
 * export class UserSeeder extends BaseSeeder {
 *   async run(em: EntityManager): Promise<void> {
 *     // Create single entity
 *     const admin = em.create(User, {
 *       name: 'Admin User',
 *       email: 'admin@example.com',
 *       role: 'admin',
 *       isActive: true,
 *     });
 *
 *     await em.persistAndFlush(admin);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Seeder with factory usage for bulk data
 * export class PostSeeder extends BaseSeeder {
 *   async run(em: EntityManager): Promise<void> {
 *     // Use factory to create multiple entities
 *     const factory = PostFactory.make(em);
 *     const posts = factory.make(100);
 *
 *     await em.persistAndFlush(posts);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Seeder that calls other seeders
 * export class DatabaseSeeder extends BaseSeeder {
 *   async run(em: EntityManager): Promise<void> {
 *     // Call multiple seeders in sequence
 *     await this.call(em, [
 *       UserSeeder,
 *       PostSeeder,
 *       CommentSeeder,
 *     ]);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Seeder with context for configuration
 * interface SeederContext {
 *   count: number;
 *   environment: 'development' | 'staging';
 * }
 *
 * export class ConfigurableSeeder extends BaseSeeder<SeederContext> {
 *   async run(em: EntityManager, context?: SeederContext): Promise<void> {
 *     const count = context?.count ?? 10;
 *     const factory = UserFactory.make(em);
 *
 *     const users = factory.make(count);
 *     await em.persistAndFlush(users);
 *   }
 * }
 * ```
 *
 * @author Nesvel
 * @since 1.0.0
 */
export abstract class BaseSeeder<T extends Dictionary = Dictionary> extends Seeder {
  /**
   * Run the seeder to populate the database
   *
   * This method must be implemented by all seeder classes. It receives an EntityManager
   * instance for database operations and an optional context object for configuration.
   *
   * The EntityManager provides methods to:
   * - Create entities: `em.create(Entity, data)`
   * - Persist entities: `em.persist(entity)`
   * - Flush changes: `em.flush()`
   * - Persist and flush: `em.persistAndFlush(entity)`
   *
   * @param em - MikroORM EntityManager instance for database operations
   * @param context - Optional context object for seeder configuration
   * @returns Promise that resolves when seeding is complete, or void for synchronous seeders
   *
   * @example
   * ```typescript
   * async run(em: EntityManager): Promise<void> {
   *   // Create and persist entities
   *   const user = em.create(User, { name: 'John', email: 'john@example.com' });
   *   await em.persistAndFlush(user);
   * }
   * ```
   */
  abstract run(em: EntityManager, context?: T): void | Promise<void>;
}
