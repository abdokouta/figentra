import { describe, it, expect } from 'vitest';
import { parseFilterQuery } from '@/http/utils/parse-filter-query.util';

describe('parseFilterQuery', () => {
  it('returns undefined for null/undefined/empty input', () => {
    expect(parseFilterQuery(null)).toBeUndefined();
    expect(parseFilterQuery(undefined)).toBeUndefined();
    expect(parseFilterQuery('')).toBeUndefined();
    expect(parseFilterQuery(0)).toBeUndefined();
  });

  it('passes through an object as-is', () => {
    const filter = { status: 'active', name: { contains: 'foo' } };
    expect(parseFilterQuery(filter)).toEqual(filter);
  });

  it('parses a valid JSON string', () => {
    const json = '{"status":"active","price":{"gt":10}}';
    expect(parseFilterQuery(json)).toEqual({
      status: 'active',
      price: { gt: 10 },
    });
  });

  it('returns undefined for invalid JSON string', () => {
    expect(parseFilterQuery('not json')).toBeUndefined();
    expect(parseFilterQuery('{broken')).toBeUndefined();
  });

  it('handles an empty object', () => {
    expect(parseFilterQuery({})).toEqual({});
  });

  it('handles a JSON string of empty object', () => {
    expect(parseFilterQuery('{}')).toEqual({});
  });

  it('handles array values in filter', () => {
    const filter = { id: { in: ['a', 'b', 'c'] } };
    expect(parseFilterQuery(filter)).toEqual(filter);
  });

  it('returns undefined for non-object/non-string types', () => {
    expect(parseFilterQuery(true)).toBeUndefined();
    expect(parseFilterQuery(42)).toBeUndefined();
  });
});
