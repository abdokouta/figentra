import { describe, it, expect } from 'vitest';
import { StaticDriver } from '@/core/drivers';

describe('StaticDriver', () => {
  it('should return values from the initial config', () => {
    const driver = new StaticDriver({ name: 'MyApp', port: 3000 });
    expect(driver.get('name')).toBe('MyApp');
    expect(driver.get('port')).toBe(3000);
  });

  it('should support dot-notation access for nested values', () => {
    const driver = new StaticDriver({ database: { host: 'localhost', port: 5432 } });
    expect(driver.get('database.host')).toBe('localhost');
    expect(driver.get('database.port')).toBe(5432);
  });

  it('should return default value for non-existent keys', () => {
    const driver = new StaticDriver({ a: 1 });
    expect(driver.get('missing', 'fallback')).toBe('fallback');
  });

  it('should report has() correctly', () => {
    const driver = new StaticDriver({ a: 1, b: { c: 2 } });
    expect(driver.has('a')).toBe(true);
    expect(driver.has('b.c')).toBe(true);
    expect(driver.has('missing')).toBe(false);
  });

  it('should return all values as a copy', () => {
    const original = { x: 1, y: 2 };
    const driver = new StaticDriver(original);
    const all = driver.all();
    expect(all).toEqual(original);
    // Verify it's a copy (not the same reference)
    all['x'] = 999;
    expect(driver.get('x')).toBe(1);
  });

  // Property: Immutability
  it('should throw on set()', () => {
    const driver = new StaticDriver({ a: 1 });
    expect(() => driver.set('a', 2)).toThrow(/read-only/i);
  });

  it('should throw on delete()', () => {
    const driver = new StaticDriver({ a: 1 });
    expect(() => driver.delete!('a')).toThrow(/read-only/i);
  });

  it('should throw on merge()', () => {
    const driver = new StaticDriver({ a: 1 });
    expect(() => driver.merge!({ b: 2 })).toThrow(/read-only/i);
  });

  it('should not allow mutation of internal data via all()', () => {
    const driver = new StaticDriver({ secret: 'value' });
    const all = driver.all();
    all['secret'] = 'hacked';
    expect(driver.get('secret')).toBe('value');
  });
});
