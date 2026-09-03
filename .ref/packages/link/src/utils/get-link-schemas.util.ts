/**
 * @file get-link-schemas.util.ts
 * @module @stackra/nestjs-link/utils
 * @description Pure utility to generate MikroORM EntitySchemas from link metadata.
 *
 * This function is called at the root module level to produce the pivot table
 * schemas that MikroORM needs at initialization time. The generated schemas
 * are passed alongside entity classes to `OrmModule.forRoot({ entities: [...] })`.
 *
 * ## Why this exists
 * MikroORM requires ALL entities/schemas to be known at boot time. Link pivot
 * tables are dynamically generated from `defineLink()` metadata — this utility
 * bridges the gap by converting link metadata into MikroORM-compatible schemas
 * that can be included in the root entity list.
 *
 * ## Usage
 * ```typescript
 * import { getLinkSchemas } from '@stackra/nestjs-link';
 * import { OrmModule } from '@stackra/nestjs-orm';
 *
 * OrmModule.forRoot({
 *   entities: [
 *     User, Role, Permission,
 *     ...getLinkSchemas(UserRoleLink, RolePermissionLink, RoleParentLink),
 *   ],
 *   connections: { ... },
 * })
 * ```
 *
 * @remarks
 * - This is a **pure function** — no side effects, no global state.
 * - Each call generates fresh schemas (idempotent — same input = same output).
 * - Read-only links are skipped (they have no pivot table).
 * - The generated schemas are also stored on the `LinkMetadata.schema` property
 *   for later use by `LinkService`.
 */

import type { ILinkMetadata } from '../interfaces/link-metadata.interface';
import { generateLinkSchema } from './generate-link-schema.util';

/**
 * Generates MikroORM EntitySchemas for one or more link definitions.
 *
 * Call this at the root level and spread the result into your ORM's
 * entity list. Read-only links (no pivot table) are automatically skipped.
 *
 * @param links - One or more `LinkMetadata` objects (from `defineLink()`)
 * @returns Array of MikroORM EntitySchema instances for the pivot tables
 *
 * @example
 * ```typescript
 * import { getLinkSchemas } from '@stackra/nestjs-link';
 * import { UserRoleLink, RolePermissionLink } from './links';
 *
 * const schemas = getLinkSchemas(UserRoleLink, RolePermissionLink);
 * // → [EntitySchema<Link_UserRole>, EntitySchema<Link_RolePermission>]
 * ```
 */
export function getLinkSchemas(...links: ILinkMetadata[]): any[] {
  const schemas: any[] = [];

  for (const link of links) {
    // Read-only links have no pivot table — skip them
    if (link.readOnly) continue;

    // Generate the schema (or reuse if already generated)
    if (!link.schema) {
      link.schema = generateLinkSchema(link);
    }

    schemas.push(link.schema);
  }

  return schemas;
}
