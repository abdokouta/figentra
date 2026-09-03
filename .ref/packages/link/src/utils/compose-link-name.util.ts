/**
 * @file compose-link-name.util.ts
 * @module @stackra/nestjs-link/utils
 * @description Generates a deterministic, unique name for a link.
 *
 * The link name is used as:
 * - The key in the LinkRegistry
 * - Part of the DI token for the link's service
 * - The MikroORM entity name for the pivot table
 *
 * ## Naming Convention
 * Concatenates source + target entity names in PascalCase:
 * - Source: `Role`, Target: `Permission` → `RolePermission`
 * - Source: `Product`, Target: `SalesChannel` → `ProductSalesChannel`
 *
 * For self-referencing links (source === target), the relation names
 * are appended to disambiguate:
 * - Source: `Role`, Target: `Role`, sourceRelation: 'parents' → `RoleParent`
 *
 * @example
 * ```typescript
 * composeLinkName(Role, Permission);
 * // => 'RolePermission'
 *
 * composeLinkName(Role, Role, 'parents', 'children');
 * // => 'RoleParent'
 * ```
 */

import { IType } from '@nestjs/common';
import { Str } from '@stackra/ts-support';

/**
 * Generates a deterministic link name from source and target entities.
 *
 * @param source - The source entity class
 * @param target - The target entity class
 * @param sourceRelation - Optional relation name (used for self-referencing links)
 * @param targetRelation - Optional relation name (used for self-referencing links)
 * @returns A unique PascalCase link name
 */
export function composeLinkName(
  source: IType<any>,
  target: IType<any>,
  sourceRelation?: string,
  targetRelation?: string
): string {
  const sourceName = source.name;
  const targetName = target.name;

  // Self-referencing link — use relation name to disambiguate
  if (sourceName === targetName && sourceRelation) {
    // Singularize the relation name and PascalCase it
    const suffix = toPascalCase(singularize(sourceRelation));
    return `${sourceName}${suffix}`;
  }

  return `${sourceName}${targetName}`;
}

/**
 * Converts a string to PascalCase.
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? Str.upper(c) : ''))
    .replace(/^(.)/, (_, c) => Str.upper(c));
}

/**
 * Naive singularization — reverses common plural suffixes.
 * Used only for link name generation, not for general-purpose use.
 */
function singularize(str: string): string {
  if (Str.endsWith(str, 'ies')) {
    return str.slice(0, -3) + 'y';
  }
  if (Str.endsWith(str, 'ves')) {
    return str.slice(0, -3) + 'f';
  }
  if (Str.endsWith(str, 'ses') || Str.endsWith(str, 'xes') || Str.endsWith(str, 'zes')) {
    return str.slice(0, -2);
  }
  if (Str.endsWith(str, 's') && !Str.endsWith(str, 'ss')) {
    return str.slice(0, -1);
  }
  return str;
}
