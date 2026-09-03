/**
 * @file database.seeder.ts
 * @module @stackra/nestjs-orm/seeders
 * @description Root DatabaseSeeder that orchestrates all seeders in topological order.
 *   Resolves FK dependencies automatically so seeders run in the correct sequence.
 *
 *   Like Laravel's DatabaseSeeder — a single entry point that seeds the entire database.
 */

import { BaseSeeder } from './base.seeder';
import { SeederContext } from './seeder-context';
import { Logger } from '@stackra/ts-logger';
import type { EntityManager } from '@mikro-orm/core';

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// DatabaseSeeder
// ============================================================================

/**
 * Root database seeder that orchestrates all seeders in topological order.
 *
 * Performs topological sort based on FK dependencies declared in each seeder
 * registration. Ensures parent entities are seeded before children.
 *
 * @example
 * ```typescript
 * // In your app's seed command or script:
 * const seeder = new DatabaseSeeder({
 *   seeders: [
 *     { seeder: UserSeeder, produces: [User], dependsOn: [] },
 *     { seeder: TenantSeeder, produces: [Tenant], dependsOn: [User, Plan] },
 *     { seeder: PlanSeeder, produces: [Plan], dependsOn: [] },
 *     { seeder: SubscriptionSeeder, produces: [Subscription], dependsOn: [Tenant, Plan] },
 *   ],
 * });
 *
 * await seeder.run(em);
 * // Execution order: UserSeeder, PlanSeeder, TenantSeeder, SubscriptionSeeder
 * ```
 */
export class DatabaseSeeder extends BaseSeeder {
  private config: IDatabaseSeederConfig;
  private readonly logger = new Logger('DatabaseSeeder');

  public constructor(config: IDatabaseSeederConfig) {
    super();
    this.config = config;
  }

  /**
   * Run all seeders in topological order.
   *
   * @param em - MikroORM EntityManager
   */
  public async run(em: EntityManager): Promise<void> {
    // Clear context if requested
    if (this.config.clearContext !== false) {
      SeederContext.clear();
    }

    // Filter by group if specified
    let seeders = this.config.seeders;
    if (this.config.groups && this.config.groups.length > 0) {
      const groups = new Set(this.config.groups);
      seeders = seeders.filter((s) => !s.group || groups.has(s.group));
    }

    // Topological sort
    const sorted = this.topologicalSort(seeders);

    // Execute in order
    for (const registration of sorted) {
      if (this.config.verbose !== false) {
        const name = registration.seeder.name ?? 'AnonymousSeeder';
        const producesNames = registration.produces.map((cls) => cls.name).join(', ');
        this.logger.info(`  🌱 Seeding: ${name} (produces: ${producesNames})`);
      }

      const seederInstance = new registration.seeder();
      await seederInstance.run(em);

      // Flush after each seeder to ensure IDs are available
      await em.flush();
    }

    if (this.config.verbose !== false) {
      this.logger.info(
        `\n  ✅ Database seeded. Context keys: [${SeederContext.keys().join(', ')}]`
      );
    }
  }

  /**
   * Topological sort of seeders based on their dependency graph.
   * Uses Kahn's algorithm (BFS-based).
   *
   * @param seeders - Unsorted seeder registrations
   * @returns Sorted registrations (dependencies first)
   * @throws Error if circular dependency detected
   */
  private topologicalSort(seeders: ISeederRegistration[]): ISeederRegistration[] {
    // Build a map of what each entity class is produced by
    const producerMap = new Map<Function, ISeederRegistration>();
    for (const s of seeders) {
      for (const entityClass of s.produces) {
        producerMap.set(entityClass, s);
      }
    }

    // Build adjacency list and in-degree count
    const graph = new Map<ISeederRegistration, Set<ISeederRegistration>>();
    const inDegree = new Map<ISeederRegistration, number>();

    for (const s of seeders) {
      if (!graph.has(s)) graph.set(s, new Set());
      if (!inDegree.has(s)) inDegree.set(s, 0);
    }

    for (const s of seeders) {
      for (const dep of s.dependsOn) {
        const producer = producerMap.get(dep);
        if (producer && producer !== s) {
          // producer must run before s
          graph.get(producer)!.add(s);
          inDegree.set(s, (inDegree.get(s) ?? 0) + 1);
        }
        // If no producer exists for a dependency, it's an external/optional dep — skip
      }
    }

    // Kahn's algorithm
    const queue: ISeederRegistration[] = [];
    for (const [node, degree] of inDegree) {
      if (degree === 0) queue.push(node);
    }

    const sorted: ISeederRegistration[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      for (const neighbor of graph.get(current) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== seeders.length) {
      const remaining = seeders
        .filter((s) => !sorted.includes(s))
        .map((s) => s.seeder.name)
        .join(', ');
      throw new Error(
        `Circular dependency detected in seeders. Remaining: [${remaining}]. ` +
          `Check the 'dependsOn' declarations for cycles.`
      );
    }

    return sorted;
  }
}
