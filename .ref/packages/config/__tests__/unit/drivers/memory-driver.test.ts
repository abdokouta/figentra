import { describe, it, expect } from 'vitest';
import { MemoryDriver } from '@/core/drivers';

describe('MemoryDriver', () => {
  it('should return initial data', () => {
    const driver = new MemoryDriver({ name: 'Test', port: 8080 });
    expect(driver.get('name')).toBe('Test');
    expect(driver.get('port')).toBe(8080);
  });

  it('should support dot-notation access', () => {
    const driver = new MemoryDriver({ db: { host: 'localhost', port: 5432 } });
    expect(driver.get('db.host')).toBe('localhost');
    expect(driver.get('db.port')).toBe(5432);
  });

  it('should support set() with dot-notation', () => {
    const driver = new MemoryDriver({});
    driver.set('app.name', 'NewApp');
    expect(driver.get('app.name')).toBe('NewApp');
  });

  it('should support has()', () => {
    const driver = new MemoryDriver({ exists: true });
    expect(driver.has('exists')).toBe(true);
    expect(driver.has('missing')).toBe(false);
  });

  it('should return default for missing keys', () => {
    const driver = new MemoryDriver({});
    expect(driver.get('nope', 'default')).toBe('default');
  });

  it('should return all data as a copy', () => {
    const driver = new MemoryDriver({ a: 1, b: 2 });
    const all = driver.all();
    expect(all).toEqual({ a: 1, b: 2 });
    all['a'] = 999;
    expect(driver.get('a')).toBe(1);
  });
});
