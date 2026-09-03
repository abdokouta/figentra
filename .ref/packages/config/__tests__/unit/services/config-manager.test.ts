import { describe, it, expect } from 'vitest';
import { ConfigManager } from '@/core/services';
import { ConfigService } from '@/core/services';
import { ConfigSourceError } from '@/core/errors';
import { CONFIG_OPTIONS } from '@stackra/contracts';

/**
 * Create a ConfigManager with test options directly (bypassing DI).
 */
function createManager(options: Record<string, unknown>): ConfigManager {
  // Manually construct with injected options (simulating DI)
  const manager = Object.create(ConfigManager.prototype);
  Object.defineProperty(manager, 'config', { value: options, writable: false });
  Object.defineProperty(manager, 'services', { value: new Map(), writable: false });
  Object.defineProperty(manager, 'eventEmitter', { value: undefined, writable: false });
  // Call the parent constructor's init
  (manager as any).instances = new Map();
  (manager as any).customCreators = new Map();
  return manager;
}

describe('ConfigManager', () => {
  describe('Source Instance Caching', () => {
    it('should return the same ConfigService instance on repeated calls', () => {
      const manager = createManager({
        default: 'env',
        sources: { env: { driver: 'env' } },
      });

      const a = manager.source('env');
      const b = manager.source('env');
      expect(a).toBe(b); // Same reference
    });

    it('should return different instances for different sources', () => {
      const manager = createManager({
        default: 'env',
        sources: {
          env: { driver: 'env' },
          memory: { driver: 'memory', config: { x: 1 } },
        },
      });

      const env = manager.source('env');
      const mem = manager.source('memory');
      expect(env).not.toBe(mem);
    });
  });

  describe('Unsupported Driver Rejection', () => {
    it('should throw ConfigSourceError for unsupported sync drivers', () => {
      const manager = createManager({
        default: 'bad',
        sources: { bad: { driver: 'nosql-quantum' } },
      });

      expect(() => manager.source('bad')).toThrow(ConfigSourceError);
    });

    it('should include the driver name in the error message', () => {
      const manager = createManager({
        default: 'bad',
        sources: { bad: { driver: 'imaginary' } },
      });

      expect(() => manager.source('bad')).toThrow(/imaginary/);
    });
  });

  describe('Default Source Resolution', () => {
    it('should resolve default source when no name provided', () => {
      const manager = createManager({
        default: 'memory',
        sources: { memory: { driver: 'memory', config: { key: 'value' } } },
      });

      const svc = manager.source();
      expect(svc).toBeInstanceOf(ConfigService);
      expect(svc.get('key')).toBe('value');
    });
  });

  describe('Introspection', () => {
    it('should list source names', () => {
      const manager = createManager({
        default: 'env',
        sources: { env: { driver: 'env' }, mem: { driver: 'memory' } },
      });

      expect(manager.getSourceNames()).toEqual(['env', 'mem']);
    });

    it('should check source existence', () => {
      const manager = createManager({
        default: 'env',
        sources: { env: { driver: 'env' } },
      });

      expect(manager.hasSource('env')).toBe(true);
      expect(manager.hasSource('missing')).toBe(false);
    });

    it('should return default source name', () => {
      const manager = createManager({
        default: 'custom',
        sources: { custom: { driver: 'memory' } },
      });

      expect(manager.getDefaultSource()).toBe('custom');
    });
  });

  describe('Source Forgetting', () => {
    it('should recreate service after forgetSource', () => {
      const manager = createManager({
        default: 'memory',
        sources: { memory: { driver: 'memory', config: { v: 1 } } },
      });

      const first = manager.source('memory');
      manager.forgetSource('memory');
      const second = manager.source('memory');
      expect(first).not.toBe(second);
    });
  });
});
