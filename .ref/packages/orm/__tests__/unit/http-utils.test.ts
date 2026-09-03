/**
 * @file http-utils.test.ts
 * @description Unit tests for parseFieldsQuery and parseIncludeQuery utilities.
 */

import { describe, it, expect } from 'vitest';
import { parseFieldsQuery } from '@/http/utils/parse-fields-query.util';
import { parseIncludeQuery } from '@/http/utils/parse-include-query.util';

// ============================================================================
// parseFieldsQuery
// ============================================================================

describe('parseFieldsQuery', () => {
  const validFields = ['id', 'name', 'email', 'status', 'created_at'];

  it('should return undefined when no param provided', () => {
    expect(parseFieldsQuery(undefined, validFields)).toBeUndefined();
    expect(parseFieldsQuery('', validFields)).toBeUndefined();
    expect(parseFieldsQuery('   ', validFields)).toBeUndefined();
  });

  it('should always include id field', () => {
    const result = parseFieldsQuery('name,email', validFields);
    expect(result).toContain('id');
  });

  it('should not duplicate id if explicitly requested', () => {
    const result = parseFieldsQuery('id,name', validFields);
    expect(result!.filter((f) => f === 'id')).toHaveLength(1);
  });

  it('should filter out invalid fields', () => {
    const result = parseFieldsQuery('name,invalid_field,email', validFields);
    expect(result).toEqual(['id', 'name', 'email']);
  });

  it('should return undefined when only invalid fields provided', () => {
    const result = parseFieldsQuery('invalid1,invalid2', validFields);
    expect(result).toBeUndefined();
  });

  it('should trim whitespace around field names', () => {
    const result = parseFieldsQuery(' name , email ', validFields);
    expect(result).toEqual(['id', 'name', 'email']);
  });

  it('should handle single valid field', () => {
    const result = parseFieldsQuery('status', validFields);
    expect(result).toEqual(['id', 'status']);
  });
});

// ============================================================================
// parseIncludeQuery
// ============================================================================

describe('parseIncludeQuery', () => {
  const validRelations = ['posts', 'author', 'category', 'tags'];

  it('should return undefined when no param provided', () => {
    expect(parseIncludeQuery(undefined, validRelations)).toBeUndefined();
    expect(parseIncludeQuery('', validRelations)).toBeUndefined();
    expect(parseIncludeQuery('   ', validRelations)).toBeUndefined();
  });

  it('should validate top-level relation names', () => {
    const result = parseIncludeQuery('posts,invalid_rel,author', validRelations);
    expect(result).toEqual(['posts', 'author']);
  });

  it('should support dot-notation for nested relations', () => {
    const result = parseIncludeQuery('posts.comments,author.profile', validRelations);
    expect(result).toEqual(['posts.comments', 'author.profile']);
  });

  it('should respect max depth limit', () => {
    const result = parseIncludeQuery('posts.comments.author.profile', validRelations, 2);
    // 4 levels exceeds maxDepth=2
    expect(result).toBeUndefined();
  });

  it('should use default max depth of 3', () => {
    // 3 levels should pass
    const result3 = parseIncludeQuery('posts.comments.likes', validRelations);
    expect(result3).toEqual(['posts.comments.likes']);

    // 4 levels should be filtered out
    const result4 = parseIncludeQuery('posts.comments.likes.user', validRelations);
    expect(result4).toBeUndefined();
  });

  it('should return undefined when all relations are invalid', () => {
    const result = parseIncludeQuery('invalid1,invalid2', validRelations);
    expect(result).toBeUndefined();
  });

  it('should trim whitespace', () => {
    const result = parseIncludeQuery(' posts , author ', validRelations);
    expect(result).toEqual(['posts', 'author']);
  });

  it('should validate top-level even for nested paths', () => {
    // "invalid.deep" should be filtered because "invalid" is not in validRelations
    const result = parseIncludeQuery('invalid.deep,posts', validRelations);
    expect(result).toEqual(['posts']);
  });
});
