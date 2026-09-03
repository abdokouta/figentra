/**
 * @file link-registry.ts
 * @module @stackra/nestjs-link/registry
 * @description Runtime registry of all defined links.
 *
 * The `LinkRegistry` is a singleton service that holds metadata for every
 * link registered via `LinkModule.forFeature()`. It provides lookup methods
 * to find links by name, by entity, or between two specific entities.
 *
 * ## Why a Registry?
 * - Allows runtime introspection of all links (useful for admin UIs, migrations)
 * - Enables the `@InjectLink()` decorator to resolve the correct service
 * - Provides a single source of truth for link metadata
 *
 * ## Lifecycle
 * 1. `LinkModule.forRoot()` creates the registry (empty)
 * 2. `LinkModule.forFeature(links)` registers each link's metadata
 * 3. Services and decorators query the registry at runtime
 *
 * @example
 * ```typescript
 * // Injecting the registry directly (advanced use)
 * @Inject(LINK_REGISTRY_TOKEN)
 * private readonly registry: LinkRegistry;
 *
 * // Find all links involving the Role entity
 * const roleLinks = registry.forEntity(Role);
 *
 * // Find the specific link between Role and Permission
 * const link = registry.between(Role, Permission);
 * ```
 */

import { IInjectable } from '@nestjs/common';
import { IType } from '@nestjs/common';
import type { ILinkMetadata } from '../interfaces/link-metadata.interface';

/**
 * LinkRegistry — holds all registered link metadata at runtime.
 *
 * Populated during module initialization when `LinkModule.forFeature()`
 * is called. Provides query methods for finding links by various criteria.
 */
@IInjectable()
export class LinkRegistry {
  /**
   * Internal storage — maps link name to its metadata.
   */
  private readonly links = new Map<string, ILinkMetadata>();

  /**
   * Register a link's metadata in the registry.
   * Called internally by `LinkModule.forFeature()`.
   *
   * @param metadata - The fully-resolved link metadata to register
   * @throws Error if a link with the same name is already registered
   */
  public register(metadata: ILinkMetadata): void {
    if (this.links.has(metadata.name)) {
      throw new Error(
        `Link "${metadata.name}" is already registered. ` +
          `Each link must have a unique name. If you have two links between ` +
          `the same entities, provide explicit relation names to disambiguate.`
      );
    }
    this.links.set(metadata.name, metadata);
  }

  /**
   * Get a link by its unique name.
   *
   * @param name - The link name (e.g., 'RolePermission')
   * @returns The link metadata, or undefined if not found
   */
  public get(name: string): ILinkMetadata | undefined {
    return this.links.get(name);
  }

  /**
   * Get a link by name, throwing if not found.
   * Use this when you expect the link to exist.
   *
   * @param name - The link name
   * @returns The link metadata
   * @throws Error if the link is not registered
   */
  public getOrFail(name: string): ILinkMetadata {
    const link = this.links.get(name);
    if (!link) {
      throw new Error(
        `Link "${name}" not found in registry. ` +
          `Make sure it's registered via LinkModule.forFeature().`
      );
    }
    return link;
  }

  /**
   * Get all registered links.
   *
   * @returns Array of all link metadata
   */
  public all(): ILinkMetadata[] {
    return Array.from(this.links.values());
  }

  /**
   * Find all links involving a specific entity (as source or target).
   *
   * @param entityClass - The entity class to search for
   * @returns Array of links that reference this entity
   *
   * @example
   * ```typescript
   * const roleLinks = registry.forEntity(Role);
   * // Returns: [RolePermissionLink, RoleParentLink, UserRoleLink, ...]
   * ```
   */
  public forEntity(entityClass: IType<any>): ILinkMetadata[] {
    return this.all().filter((l) => l.source === entityClass || l.target === entityClass);
  }

  /**
   * Find the link between two specific entities.
   * Checks both directions (source→target and target→source).
   *
   * @param sourceClass - One entity class
   * @param targetClass - The other entity class
   * @returns The link metadata, or undefined if no link exists between them
   *
   * @example
   * ```typescript
   * const link = registry.between(Role, Permission);
   * ```
   */
  public between(sourceClass: IType<any>, targetClass: IType<any>): ILinkMetadata | undefined {
    return this.all().find(
      (l) =>
        (l.source === sourceClass && l.target === targetClass) ||
        (l.source === targetClass && l.target === sourceClass)
    );
  }

  /**
   * Check if a link with the given name exists.
   *
   * @param name - The link name to check
   * @returns true if the link is registered
   */
  public has(name: string): boolean {
    return this.links.has(name);
  }

  /**
   * Get the total number of registered links.
   */
  get size(): number {
    return this.links.size;
  }
}
