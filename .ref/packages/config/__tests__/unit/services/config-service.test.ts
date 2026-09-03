import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '@/core/services';
import { MemoryDriver } from '@/core/drivers';
import { ConfigMissingKeyError } from '@/core/errors';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    const driver = new MemoryDriver({
      APP_NAME: 'TestApp',
      PORT: '3000',
      DEBUG: 'true',
      VERBOSE: 'false',
      DB_HOST: 'localhost',
      DB_PASSWORD: 'secret123',
      TAGS: 'a, b, c',
      JSON_DATA: '{"key":"value"}',
      EMPTY: '',
      ZERO: '0',
      BOOL_YES: 'yes',
      BOOL_ON: 'on',
      BOOL_ONE: '1',
      database: { host: 'db.local', port: 5432 },
    });
    service = new ConfigService(driver, ['DB_PASSWORD', '*_SECRET'], 'test');
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Typed Getters
  // ══════════════════════════════════════════════════════════════════════════════

  describe('getString', () => {
    it('should return string values', () => {
      expect(service.getString('APP_NAME')).toBe('TestApp');
    });

    it('should coerce numbers to strings', () => {
      expect(service.getString('PORT')).toBe('3000');
    });

    it('should return default for missing keys', () => {
      expect(service.getString('MISSING', 'fallback')).toBe('fallback');
    });

    it('should always return a string type', () => {
      const values = ['APP_NAME', 'PORT', 'DEBUG', 'EMPTY'].map((k) => service.getString(k));
      for (const v of values) {
        expect(typeof v).toBe('string');
      }
    });
  });

  describe('getNumber', () => {
    it('should parse numeric strings', () => {
      expect(service.getNumber('PORT')).toBe(3000);
    });

    it('should return default for non-numeric strings', () => {
      expect(service.getNumber('APP_NAME', 99)).toBe(99);
    });

    it('should return 0 for missing keys without default', () => {
      expect(service.getNumber('MISSING')).toBe(0);
    });

    it('should handle zero correctly', () => {
      expect(service.getNumber('ZERO')).toBe(0);
    });
  });

  describe('getBool', () => {
    it('should treat "true" as true', () => {
      expect(service.getBool('DEBUG')).toBe(true);
    });

    it('should treat "false" as false', () => {
      expect(service.getBool('VERBOSE')).toBe(false);
    });

    it('should treat "yes", "on", "1" as true', () => {
      expect(service.getBool('BOOL_YES')).toBe(true);
      expect(service.getBool('BOOL_ON')).toBe(true);
      expect(service.getBool('BOOL_ONE')).toBe(true);
    });

    it('should treat any other string as false', () => {
      expect(service.getBool('APP_NAME')).toBe(false);
    });

    it('should return default for missing keys', () => {
      expect(service.getBool('MISSING', true)).toBe(true);
    });
  });

  describe('getArray', () => {
    it('should split comma-separated values', () => {
      expect(service.getArray('TAGS')).toEqual(['a', 'b', 'c']);
    });

    it('should return default for missing keys', () => {
      expect(service.getArray('MISSING', ['x'])).toEqual(['x']);
    });

    it('should filter empty segments', () => {
      const driver = new MemoryDriver({ CSV: 'a,,b,,' });
      const svc = new ConfigService(driver, [], 'test');
      expect(svc.getArray('CSV')).toEqual(['a', 'b']);
    });
  });

  describe('getJson', () => {
    it('should parse JSON strings', () => {
      expect(service.getJson('JSON_DATA')).toEqual({ key: 'value' });
    });

    it('should return default on invalid JSON', () => {
      expect(service.getJson('APP_NAME', { fallback: true })).toEqual({ fallback: true });
    });

    it('should return objects as-is', () => {
      expect(service.getJson('database')).toEqual({ host: 'db.local', port: 5432 });
    });
  });

  describe('getOrThrow', () => {
    it('should return value when key exists', () => {
      expect(service.getOrThrow('APP_NAME')).toBe('TestApp');
    });

    it('should throw ConfigMissingKeyError for missing keys', () => {
      expect(() => service.getOrThrow('MISSING')).toThrow(ConfigMissingKeyError);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Runtime Overrides
  // ══════════════════════════════════════════════════════════════════════════════

  describe('Overrides', () => {
    it('should override driver values', () => {
      service.set('APP_NAME', 'Overridden');
      expect(service.get('APP_NAME')).toBe('Overridden');
    });

    it('should revert to driver value after unset', () => {
      service.set('APP_NAME', 'Overridden');
      service.unset('APP_NAME');
      expect(service.get('APP_NAME')).toBe('TestApp');
    });

    it('should clear all overrides', () => {
      service.set('APP_NAME', 'A');
      service.set('PORT', 'B');
      service.clearCache();
      expect(service.get('APP_NAME')).toBe('TestApp');
      expect(service.get('PORT')).toBe('3000');
    });

    it('overrides should have highest precedence', () => {
      service.set('PORT', '9999');
      expect(service.getString('PORT')).toBe('9999');
      expect(service.getNumber('PORT')).toBe(9999);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Sensitive Key Masking
  // ══════════════════════════════════════════════════════════════════════════════

  describe('Sensitive Keys', () => {
    it('should redact sensitive keys in toSafeObject()', () => {
      const safe = service.toSafeObject();
      expect(safe['DB_PASSWORD']).toBe('[REDACTED]');
    });

    it('should NOT redact in get()', () => {
      expect(service.get('DB_PASSWORD')).toBe('secret123');
    });

    it('should support custom placeholder', () => {
      const safe = service.toSafeObject('***');
      expect(safe['DB_PASSWORD']).toBe('***');
    });

    it('should support wildcard patterns', () => {
      const driver = new MemoryDriver({ API_SECRET: 'abc', JWT_SECRET: 'xyz', NORMAL: 'ok' });
      const svc = new ConfigService(driver, ['*_SECRET'], 'test');
      const safe = svc.toSafeObject();
      expect(safe['API_SECRET']).toBe('[REDACTED]');
      expect(safe['JWT_SECRET']).toBe('[REDACTED]');
      expect(safe['NORMAL']).toBe('ok');
    });

    it('should allow marking keys at runtime', () => {
      service.markSensitive('APP_NAME');
      const safe = service.toSafeObject();
      expect(safe['APP_NAME']).toBe('[REDACTED]');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Serialization
  // ══════════════════════════════════════════════════════════════════════════════

  describe('Serialization', () => {
    it('toObject() should return all values including overrides', () => {
      service.set('EXTRA', 'new');
      const obj = service.toObject();
      expect(obj['EXTRA']).toBe('new');
      expect(obj['APP_NAME']).toBe('TestApp');
    });

    it('toFlatMap() should return flat dot-notation map', () => {
      const flat = service.toFlatMap();
      expect(typeof flat['APP_NAME']).toBe('string');
      expect(flat['database.host']).toBe('db.local');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // Source Tracing
  // ══════════════════════════════════════════════════════════════════════════════

  describe('trace()', () => {
    it('should return source info for driver values', () => {
      const trace = service.trace('APP_NAME');
      expect(trace.source).toBe('test');
      expect(trace.value).toBe('TestApp');
    });

    it('should indicate runtime override', () => {
      service.set('APP_NAME', 'Override');
      const trace = service.trace('APP_NAME');
      expect(trace.overriddenBy).toBe('runtime-override');
      expect(trace.value).toBe('Override');
    });
  });
});
