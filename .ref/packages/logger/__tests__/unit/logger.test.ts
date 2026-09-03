/**
 * @file logger.test.ts
 * @description Tests for the Logger service using @stackra/testing infrastructure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '@/core/services/logger.service';
import { LoggerManager } from '@/core/services/logger-manager.service';
import { LogLevel } from '@stackra/contracts';

// ============================================================================
// Test helpers — Minimal mock LoggerManager
// ============================================================================

function createMockManager() {
  const dispatched: Array<{ entry: any; channel?: string }> = [];

  const manager = {
    dispatch(entry: any, channel?: string) {
      dispatched.push({ entry, channel });
    },
    getDispatched() {
      return dispatched;
    },
    clear() {
      dispatched.length = 0;
    },
  };

  // Set as static instance so Logger can find it
  (LoggerManager as any).instance = manager;

  return manager;
}

describe('Logger', () => {
  let manager: ReturnType<typeof createMockManager>;
  let logger: Logger;

  beforeEach(() => {
    manager = createMockManager();
    logger = new Logger('TestContext', undefined, manager as any);
  });

  // ==========================================================================
  // Basic Logging
  // ==========================================================================

  describe('basic logging', () => {
    it('debug() dispatches a DEBUG entry', () => {
      logger.debug('debug message');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.level).toBe(LogLevel.DEBUG);
      expect(entry.message).toBe('debug message');
      expect(entry.context).toBe('TestContext');
    });

    it('info() dispatches an INFO entry', () => {
      logger.info('info message', { extra: true });

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.message).toBe('info message');
      expect(entry.meta).toEqual({ extra: true });
    });

    it('warn() dispatches a WARN entry', () => {
      logger.warn('warning');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.level).toBe(LogLevel.WARN);
    });

    it('error() dispatches an ERROR entry with error object', () => {
      const err = new Error('something broke');
      logger.error('failed', err, { operationId: 'abc' });

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.message).toBe('failed');
      expect(entry.error).toBe(err);
      expect(entry.meta).toEqual({ operationId: 'abc' });
    });

    it('fatal() dispatches a FATAL entry', () => {
      logger.fatal('system crashed');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.level).toBe(LogLevel.FATAL);
    });

    it('log() accepts string level name', () => {
      logger.log('error', 'dynamic level');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.level).toBe(LogLevel.ERROR);
    });
  });

  // ==========================================================================
  // Entry structure
  // ==========================================================================

  describe('entry structure', () => {
    it('includes timestamp in ISO format', () => {
      logger.info('test');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('includes context from constructor', () => {
      const customLogger = new Logger('OrderService', undefined, manager as any);
      customLogger.info('hello');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.context).toBe('OrderService');
    });

    it('dispatches to specified channel', () => {
      const channelLogger = new Logger('Ctx', 'audit', manager as any);
      channelLogger.info('audited action');

      expect(manager.getDispatched()[0]!.channel).toBe('audit');
    });
  });

  // ==========================================================================
  // Child Loggers
  // ==========================================================================

  describe('child loggers', () => {
    it('child() creates a logger that merges parent meta', () => {
      const child = logger.child({ requestId: 'req-123' }) as Logger;
      (child as any).manager = manager;
      child.info('from child');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.meta).toEqual({ requestId: 'req-123' });
    });

    it('child meta merges with per-call meta', () => {
      const child = new Logger('Ctx', undefined, manager as any, { requestId: 'req-1' });
      child.info('test', { action: 'create' });

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.meta).toEqual({ requestId: 'req-1', action: 'create' });
    });

    it('nested children merge all ancestor metadata', () => {
      const child1 = new Logger('Ctx', undefined, manager as any, { a: 1 });
      const child2 = child1.child({ b: 2 }) as Logger;
      (child2 as any).manager = manager;
      child2.info('deep');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.meta).toEqual({ a: 1, b: 2 });
    });
  });

  // ==========================================================================
  // Mutable Context
  // ==========================================================================

  describe('withContext / withoutContext', () => {
    it('withContext adds metadata to subsequent calls', () => {
      logger.withContext({ userId: 'u1' });
      logger.info('test');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.meta).toEqual({ userId: 'u1' });
    });

    it('withoutContext(keys) removes specific keys', () => {
      logger.withContext({ userId: 'u1', ownerId: 't1' });
      logger.withoutContext(['ownerId']);
      logger.info('test');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.meta).toEqual({ userId: 'u1' });
    });

    it('withoutContext() with no keys clears all', () => {
      logger.withContext({ a: 1, b: 2 });
      logger.withoutContext();
      logger.info('test');

      const entry = manager.getDispatched()[0]!.entry;
      expect(entry.meta).toBeUndefined();
    });
  });

  // ==========================================================================
  // Performance Timing
  // ==========================================================================

  describe('time / timeEnd', () => {
    it('timeEnd logs duration at debug level', () => {
      logger.time('operation');
      // Simulate some time passing
      logger.timeEnd('operation');

      const entries = manager.getDispatched();
      const timerEntry = entries.find((d) => d.entry.message.includes('Timer [operation]'));
      expect(timerEntry).toBeDefined();
      expect(timerEntry!.entry.level).toBe(LogLevel.DEBUG);
      expect(timerEntry!.entry.meta?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('timeEnd does nothing for unknown label', () => {
      logger.timeEnd('unknown-label');
      expect(manager.getDispatched()).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Graceful fallback when no manager
  // ==========================================================================

  describe('no manager fallback', () => {
    it('falls back to console.log when no manager is set', () => {
      (LoggerManager as any).instance = null;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const noMgrLogger = new Logger('Fallback');
      noMgrLogger.info('fallback message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Fallback]'));
      consoleSpy.mockRestore();
    });
  });
});
