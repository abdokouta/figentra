import { describe, it, expect } from 'vitest';
import { parseSortQuery } from '@/http/utils/parse-sort-query.util';

describe('parseSortQuery', () => {
  it('returns undefined for null/undefined/empty input', () => {
    expect(parseSortQuery(null)).toBeUndefined();
    expect(parseSortQuery(undefined)).toBeUndefined();
    expect(parseSortQuery('')).toBeUndefined();
  });

  it('returns undefined for non-string input', () => {
    expect(parseSortQuery(123)).toBeUndefined();
    expect(parseSortQuery({})).toBeUndefined();
    expect(parseSortQuery([])).toBeUndefined();
  });

  it('parses a single ascending field', () => {
    expect(parseSortQuery('name')).toEqual({ name: 'asc' });
  });

  it('parses a single descending field with - prefix', () => {
    expect(parseSortQuery('-createdAt')).toEqual({ createdAt: 'desc' });
  });

  it('parses a single ascending field with + prefix', () => {
    expect(parseSortQuery('+price')).toEqual({ price: 'asc' });
  });

  it('parses multiple comma-separated fields', () => {
    expect(parseSortQuery('-createdAt,name')).toEqual({
      createdAt: 'desc',
      name: 'asc',
    });
  });

  it('handles mixed directions', () => {
    expect(parseSortQuery('-updatedAt,+name,price')).toEqual({
      updatedAt: 'desc',
      name: 'asc',
      price: 'asc',
    });
  });

  it('trims whitespace around field names', () => {
    expect(parseSortQuery(' -createdAt , name ')).toEqual({
      createdAt: 'desc',
      name: 'asc',
    });
  });

  it('filters out empty segments from double commas', () => {
    expect(parseSortQuery('name,,price')).toEqual({
      name: 'asc',
      price: 'asc',
    });
  });

  it('returns undefined for a string of only commas/spaces', () => {
    expect(parseSortQuery(', , ,')).toBeUndefined();
  });
});
