import { describe, it, expect } from 'vitest';
import { flatten, unflatten } from '@/core/utils';

describe('Flatten / Unflatten Utilities', () => {
  describe('flatten', () => {
    it('should flatten a simple nested object', () => {
      const obj = { database: { host: 'localhost', port: 5432 } };
      expect(flatten(obj)).toEqual({
        'database.host': 'localhost',
        'database.port': '5432',
      });
    });

    it('should flatten deeply nested objects', () => {
      const obj = { a: { b: { c: 'deep' } } };
      expect(flatten(obj)).toEqual({ 'a.b.c': 'deep' });
    });

    it('should handle arrays with numeric indices', () => {
      const obj = { servers: ['a', 'b', 'c'] };
      expect(flatten(obj)).toEqual({
        'servers.0': 'a',
        'servers.1': 'b',
        'servers.2': 'c',
      });
    });

    it('should handle null and undefined as empty string', () => {
      const obj = { a: null, b: undefined } as any;
      const result = flatten(obj);
      expect(result['a']).toBe('');
      expect(result['b']).toBe('');
    });

    it('should handle boolean values', () => {
      const obj = { debug: true, verbose: false };
      expect(flatten(obj)).toEqual({ debug: 'true', verbose: 'false' });
    });
  });

  describe('unflatten', () => {
    it('should reconstruct a nested object from a flat map', () => {
      const flat = { 'database.host': 'localhost', 'database.port': '5432' };
      expect(unflatten(flat)).toEqual({
        database: { host: 'localhost', port: '5432' },
      });
    });

    it('should handle top-level keys', () => {
      const flat = { APP_NAME: 'MyApp' };
      expect(unflatten(flat)).toEqual({ APP_NAME: 'MyApp' });
    });

    it('should handle numeric indices as arrays', () => {
      const flat = { 'servers.0': 'a', 'servers.1': 'b' };
      const result = unflatten(flat);
      expect(result.servers).toEqual(['a', 'b']);
    });
  });

  describe('Round-trip property', () => {
    it('should round-trip simple nested objects', () => {
      const testCases = [
        { app: { name: 'test', port: '3000' } },
        { database: { host: 'localhost', credentials: { user: 'admin', pass: 'secret' } } },
        { single: 'value' },
      ];

      for (const obj of testCases) {
        const flat = flatten(obj);
        const restored = unflatten(flat);
        expect(restored).toEqual(obj);
      }
    });

    it('should round-trip objects with string values', () => {
      const obj = {
        a: { b: 'hello', c: 'world' },
        d: { e: { f: 'deep' } },
      };
      const flat = flatten(obj);
      const restored = unflatten(flat);
      expect(restored).toEqual(obj);
    });
  });
});
