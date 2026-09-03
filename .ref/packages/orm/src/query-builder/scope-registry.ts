/**
 * @file scope-registry.ts
 * @module @stackra/nestjs-orm/query-builder
 * @description Registry that stores named query scopes per entity class.
 *   Scopes are registered via the `@Scope()` decorator and resolved at query time
 *   by the FluentQueryBuilder or service layer.
 */

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Registry
// ============================================================================

/**
 * Registry that stores named query scopes per entity class.
 *
 * Scopes are registered at module initialization by reading `@Scope()` decorator
 * metadata from all registered entities. At query time, the FluentQueryBuilder
 * or defineService output looks up scopes by entity name and scope name.
 *
 * @example
 * ```typescript
 * const registry = new ScopeRegistry();
 * registry.register('Product', { name: 'active', conditions: { is_active: true } });
 * registry.register('Product', { name: 'recent', callback: (qb) => qb.where({ ... }) });
 *
 * const scope = registry.get('Product', 'active');
 * const defaults = registry.getDefaultScopes('Product');
 * ```
 */
export class ScopeRegistry {
  /** Map of entity name → Map of scope name → scope definition. */
  private readonly scopes = new Map<string, Map<string, IScopeDefinition>>();

  /** Map of entity name → array of default scope names. */
  private readonly defaults = new Map<string, string[]>();

  /**
   * Register a named scope for an entity.
   *
   * @param entityName - The entity class name (lowercase)
   * @param scope - The scope definition
   */
  public register(entityName: string, scope: IScopeDefinition): void {
    if (!this.scopes.has(entityName)) {
      this.scopes.set(entityName, new Map());
    }
    this.scopes.get(entityName)!.set(scope.name, scope);
  }

  /**
   * Register default scopes for an entity.
   *
   * @param entityName - The entity class name (lowercase)
   * @param names - Array of scope names to apply by default
   */
  public registerDefaults(entityName: string, names: string[]): void {
    this.defaults.set(entityName, names);
  }

  /**
   * Retrieve a scope definition by entity and scope name.
   *
   * @param entityName - The entity class name (lowercase)
   * @param scopeName - The scope name to look up
   * @returns The scope definition, or undefined if not found
   */
  public get(entityName: string, scopeName: string): IScopeDefinition | undefined {
    return this.scopes.get(entityName)?.get(scopeName);
  }

  /**
   * Get the default scope names for an entity.
   *
   * @param entityName - The entity class name (lowercase)
   * @returns Array of default scope names (empty if none configured)
   */
  public getDefaultScopes(entityName: string): string[] {
    return this.defaults.get(entityName) ?? [];
  }

  /**
   * Get all registered scope names for an entity.
   *
   * @param entityName - The entity class name (lowercase)
   * @returns Array of all scope names
   */
  public getScopeNames(entityName: string): string[] {
    const entityScopes = this.scopes.get(entityName);
    if (!entityScopes) return [];
    return Array.from(entityScopes.keys());
  }

  /**
   * Check if a scope exists for an entity.
   *
   * @param entityName - The entity class name (lowercase)
   * @param scopeName - The scope name to check
   * @returns True if the scope is registered
   */
  public has(entityName: string, scopeName: string): boolean {
    return this.scopes.get(entityName)?.has(scopeName) ?? false;
  }
}
