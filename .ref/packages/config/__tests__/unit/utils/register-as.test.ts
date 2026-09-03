import { describe, it, expect } from 'vitest';
import { registerAs } from '@/core/utils';

describe('registerAs Utility', () => {
  it('should return a callable function', () => {
    const factory = registerAs('database', () => ({ host: 'localhost' }));
    expect(typeof factory).toBe('function');
  });

  it('should attach a KEY symbol property', () => {
    const factory = registerAs('database', () => ({ host: 'localhost' }));
    expect(typeof factory.KEY).toBe('symbol');
    expect(factory.KEY).toBe(Symbol.for('config:database'));
  });

  it('should attach a namespace string property', () => {
    const factory = registerAs('mail', () => ({ smtp: 'smtp.example.com' }));
    expect(factory.namespace).toBe('mail');
  });

  it('should produce the config when called', () => {
    const factory = registerAs('redis', () => ({
      host: '127.0.0.1',
      port: 6379,
    }));
    const result = factory();
    expect(result).toEqual({ host: '127.0.0.1', port: 6379 });
  });

  it('should produce unique KEY symbols for different namespaces', () => {
    const a = registerAs('alpha', () => ({}));
    const b = registerAs('beta', () => ({}));
    expect(a.KEY).not.toBe(b.KEY);
  });

  it('should produce the same KEY symbol for the same namespace', () => {
    const a = registerAs('same', () => ({}));
    const b = registerAs('same', () => ({}));
    expect(a.KEY).toBe(b.KEY);
  });
});
