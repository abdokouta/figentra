import { describe, it, expect } from 'vitest';
import { getNestedValue, hasNestedValue } from '@/core/utils';

describe('Dot-Notation Utilities', () => {
  describe('getNestedValue', () => {
    it('should return top-level values', () => {
      const obj = { name: 'MyApp', port: 3000 };
      expect(getNestedValue(obj, 'name')).toBe('MyApp');
      expect(getNestedValue(obj, 'port')).toBe(3000);
    });

    it('should traverse nested objects', () => {
      const obj = { database: { host: 'localhost', port: 5432 } };
      expect(getNestedValue(obj, 'database.host')).toBe('localhost');
      expect(getNestedValue(obj, 'database.port')).toBe(5432);
    });

    it('should traverse deeply nested objects', () => {
      const obj = { a: { b: { c: { d: 'deep' } } } };
      expect(getNestedValue(obj, 'a.b.c.d')).toBe('deep');
    });

    it('should return default for non-existent keys', () => {
      const obj = { name: 'app' };
      expect(getNestedValue(obj, 'missing', 'fallback')).toBe('fallback');
      expect(getNestedValue(obj, 'a.b.c', 42)).toBe(42);
    });

    it('should return default when path traverses through null', () => {
      const obj = { a: null } as any;
      expect(getNestedValue(obj, 'a.b', 'default')).toBe('default');
    });

    it('should return default when path traverses through a primitive', () => {
      const obj = { a: 'string' } as any;
      expect(getNestedValue(obj, 'a.b', 'default')).toBe('default');
    });

    it('should return undefined for non-existent keys without default', () => {
      const obj = { name: 'app' };
      expect(getNestedValue(obj, 'missing')).toBeUndefined();
    });

    // Property-style: random nested objects
    it('should correctly resolve any valid path in a generated object', () => {
      const testCases = [
        { obj: { x: { y: { z: 99 } } }, path: 'x.y.z', expected: 99 },
        { obj: { arr: [1, 2, 3] }, path: 'arr', expected: [1, 2, 3] },
        { obj: { a: { b: false } }, path: 'a.b', expected: false },
        { obj: { a: { b: 0 } }, path: 'a.b', expected: 0 },
        { obj: { a: { b: '' } }, path: 'a.b', expected: '' },
      ];

      for (const { obj, path, expected } of testCases) {
        expect(getNestedValue(obj, path)).toEqual(expected);
      }
    });
  });

  describe('hasNestedValue', () => {
    it('should return true for existing keys', () => {
      const obj = { database: { host: 'localhost' } };
      expect(hasNestedValue(obj, 'database')).toBe(true);
      expect(hasNestedValue(obj, 'database.host')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      const obj = { database: { host: 'localhost' } };
      expect(hasNestedValue(obj, 'missing')).toBe(false);
      expect(hasNestedValue(obj, 'database.port')).toBe(false);
      expect(hasNestedValue(obj, 'a.b.c')).toBe(false);
    });

    it('should be consistent with getNestedValue', () => {
      const obj = { a: 'val', b: { c: 'nested' }, d: { e: 'exists' } };
      const keys = ['a', 'b', 'b.c', 'd.e', 'missing', 'a.x'];

      for (const key of keys) {
        const getValue = getNestedValue(obj as any, key);
        const hasValue = hasNestedValue(obj as any, key);
        if (getValue === undefined) {
          expect(hasValue).toBe(false);
        } else {
          expect(hasValue).toBe(true);
        }
      }
    });
  });
});
