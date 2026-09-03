/**
 * @file decorators.test.ts
 * @description Unit tests for ORM decorators metadata registration.
 */

import { describe, it, expect } from 'vitest';
import { Scope, DefaultScope, getScopes, getDefaultScopeNames } from '@/decorators/scope.decorator';
import { EagerLoad, getEagerLoadRelations } from '@/decorators/eager-load.decorator';
import {
  BeforeCreate,
  AfterCreate,
  BeforeUpdate,
  AfterUpdate,
  BeforeDelete,
  AfterDelete,
  getLifecycleHooks,
} from '@/decorators/lifecycle.decorator';
import { ScopeRegistry } from '@/query-builder/scope-registry';

// ============================================================================
// @Scope / @DefaultScope
// ============================================================================

describe('@Scope and @DefaultScope decorators', () => {
  it('should store static scope conditions', () => {
    @Scope('active', { is_active: true })
    @Scope('published', { published_at: { $ne: null } })
    class TestEntity {}

    const scopes = getScopes(TestEntity);
    expect(scopes).toHaveLength(2);
    // Decorators stack bottom-to-top: 'published' is processed first, then 'active' pushed
    expect(scopes[0]!.name).toBe('published');
    expect(scopes[0]!.conditions).toEqual({ published_at: { $ne: null } });
    expect(scopes[1]!.name).toBe('active');
    expect(scopes[1]!.conditions).toEqual({ is_active: true });
    expect(scopes[1]!.callback).toBeUndefined();
  });

  it('should store dynamic scope callbacks', () => {
    const cb = (qb: any) => qb.where({ age: { $gte: 18 } });

    @Scope('adults', cb)
    class TestEntity {}

    const scopes = getScopes(TestEntity);
    expect(scopes).toHaveLength(1);
    expect(scopes[0]!.name).toBe('adults');
    expect(scopes[0]!.conditions).toBeUndefined();
    expect(scopes[0]!.callback).toBe(cb);
  });

  it('should store default scope names', () => {
    @DefaultScope('active', 'notArchived')
    class TestEntity {}

    const defaults = getDefaultScopeNames(TestEntity);
    expect(defaults).toEqual(['active', 'notArchived']);
  });

  it('should return empty arrays for undecorated classes', () => {
    class PlainEntity {}

    expect(getScopes(PlainEntity)).toEqual([]);
    expect(getDefaultScopeNames(PlainEntity)).toEqual([]);
  });
});

describe('ScopeRegistry', () => {
  it('should register and retrieve scopes', () => {
    const registry = new ScopeRegistry();
    registry.register('product', { name: 'active', conditions: { is_active: true } });
    registry.register('product', { name: 'cheap', conditions: { price: { $lt: 10 } } });

    expect(registry.get('product', 'active')).toBeDefined();
    expect(registry.get('product', 'active')!.conditions).toEqual({ is_active: true });
    expect(registry.get('product', 'cheap')).toBeDefined();
    expect(registry.get('product', 'nonexistent')).toBeUndefined();
  });

  it('should register and retrieve default scopes', () => {
    const registry = new ScopeRegistry();
    registry.registerDefaults('product', ['active', 'visible']);

    expect(registry.getDefaultScopes('product')).toEqual(['active', 'visible']);
    expect(registry.getDefaultScopes('unknown')).toEqual([]);
  });

  it('should report scope existence correctly', () => {
    const registry = new ScopeRegistry();
    registry.register('user', { name: 'verified', conditions: { verified: true } });

    expect(registry.has('user', 'verified')).toBe(true);
    expect(registry.has('user', 'nonexistent')).toBe(false);
    expect(registry.has('unknown', 'verified')).toBe(false);
  });

  it('should list all scope names for an entity', () => {
    const registry = new ScopeRegistry();
    registry.register('post', { name: 'published', conditions: {} });
    registry.register('post', { name: 'recent', conditions: {} });

    expect(registry.getScopeNames('post')).toEqual(['published', 'recent']);
    expect(registry.getScopeNames('unknown')).toEqual([]);
  });
});

// ============================================================================
// @EagerLoad
// ============================================================================

describe('@EagerLoad decorator', () => {
  it('should store relation names', () => {
    @EagerLoad(['translations', 'category', 'author'])
    class TestEntity {}

    const relations = getEagerLoadRelations(TestEntity);
    expect(relations).toEqual(['translations', 'category', 'author']);
  });

  it('should support dot-notation for nested relations', () => {
    @EagerLoad(['author.profile', 'comments.user'])
    class TestEntity {}

    const relations = getEagerLoadRelations(TestEntity);
    expect(relations).toEqual(['author.profile', 'comments.user']);
  });

  it('should return empty array for undecorated classes', () => {
    class PlainEntity {}
    expect(getEagerLoadRelations(PlainEntity)).toEqual([]);
  });
});

// ============================================================================
// Lifecycle Decorators
// ============================================================================

describe('Lifecycle decorators', () => {
  it('should register methods for each lifecycle event', () => {
    class TestEntity {
      @BeforeCreate()
      onBeforeCreate() {}

      @AfterCreate()
      onAfterCreate() {}

      @BeforeUpdate()
      onBeforeUpdate() {}

      @AfterUpdate()
      onAfterUpdate() {}

      @BeforeDelete()
      onBeforeDelete() {}

      @AfterDelete()
      onAfterDelete() {}
    }

    const hooks = getLifecycleHooks(TestEntity);
    expect(hooks.get('beforeCreate')).toEqual(['onBeforeCreate']);
    expect(hooks.get('afterCreate')).toEqual(['onAfterCreate']);
    expect(hooks.get('beforeUpdate')).toEqual(['onBeforeUpdate']);
    expect(hooks.get('afterUpdate')).toEqual(['onAfterUpdate']);
    expect(hooks.get('beforeDelete')).toEqual(['onBeforeDelete']);
    expect(hooks.get('afterDelete')).toEqual(['onAfterDelete']);
  });

  it('should support multiple methods for same event', () => {
    class TestEntity {
      @BeforeCreate()
      generateSlug() {}

      @BeforeCreate()
      setDefaults() {}
    }

    const hooks = getLifecycleHooks(TestEntity);
    expect(hooks.get('beforeCreate')).toEqual(['generateSlug', 'setDefaults']);
  });

  it('should return empty map for undecorated classes', () => {
    class PlainEntity {}
    const hooks = getLifecycleHooks(PlainEntity);
    expect(hooks.size).toBe(0);
  });
});
