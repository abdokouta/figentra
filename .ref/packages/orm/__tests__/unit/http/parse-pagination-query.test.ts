import { describe, it, expect } from 'vitest';
import { parsePaginationQuery } from '@/http/utils/parse-pagination-query.util';

describe('parsePaginationQuery', () => {
  it('returns defaults when query is empty', () => {
    expect(parsePaginationQuery({})).toEqual({ page: 1, limit: 20 });
  });

  it('returns defaults when query is null/undefined', () => {
    expect(parsePaginationQuery(null)).toEqual({ page: 1, limit: 20 });
    expect(parsePaginationQuery(undefined)).toEqual({ page: 1, limit: 20 });
  });

  it('parses page and limit from query', () => {
    expect(parsePaginationQuery({ page: '3', limit: '50' })).toEqual({
      page: 3,
      limit: 50,
    });
  });

  it('accepts numeric values', () => {
    expect(parsePaginationQuery({ page: 2, limit: 10 })).toEqual({
      page: 2,
      limit: 10,
    });
  });

  it('accepts per_page as an alias for limit', () => {
    expect(parsePaginationQuery({ page: 1, per_page: 25 })).toEqual({
      page: 1,
      limit: 25,
    });
  });

  it('accepts perPage as an alias for limit', () => {
    expect(parsePaginationQuery({ page: 1, perPage: 30 })).toEqual({
      page: 1,
      limit: 30,
    });
  });

  it('clamps page to minimum 1', () => {
    expect(parsePaginationQuery({ page: 0 })).toEqual({ page: 1, limit: 20 });
    expect(parsePaginationQuery({ page: -5 })).toEqual({ page: 1, limit: 20 });
  });

  it('clamps limit to minimum 1', () => {
    // 0 is falsy so falls through to DEFAULT_LIMIT (20)
    expect(parsePaginationQuery({ limit: 0 })).toEqual({ page: 1, limit: 20 });
    // -10 is truthy but clamped by Math.max(1, -10) = 1
    expect(parsePaginationQuery({ limit: -10 })).toEqual({ page: 1, limit: 1 });
  });

  it('clamps limit to maximum 100', () => {
    expect(parsePaginationQuery({ limit: 500 })).toEqual({ page: 1, limit: 100 });
    expect(parsePaginationQuery({ limit: 101 })).toEqual({ page: 1, limit: 100 });
  });

  it('floors fractional page numbers', () => {
    expect(parsePaginationQuery({ page: '2.7' })).toEqual({ page: 2, limit: 20 });
  });

  it('floors fractional limit values', () => {
    expect(parsePaginationQuery({ limit: '15.9' })).toEqual({ page: 1, limit: 15 });
  });

  it('handles non-numeric strings with default fallback', () => {
    expect(parsePaginationQuery({ page: 'abc', limit: 'xyz' })).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it('accepts p as an alias for page', () => {
    expect(parsePaginationQuery({ p: 4 })).toEqual({ page: 4, limit: 20 });
  });
});
