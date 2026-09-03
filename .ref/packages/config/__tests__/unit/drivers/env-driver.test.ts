import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnvDriver } from '@/core/drivers';

describe('EnvDriver', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should read from process.env', () => {
    process.env.TEST_KEY = 'test_value';
    const driver = new EnvDriver({});
    driver.load();
    expect(driver.get('TEST_KEY')).toBe('test_value');
  });

  it('should return default for non-existent keys', () => {
    const driver = new EnvDriver({});
    driver.load();
    expect(driver.get('NON_EXISTENT', 'fallback')).toBe('fallback');
  });

  it('should strip VITE_ prefix when envPrefix is auto', () => {
    process.env.VITE_APP_NAME = 'MyApp';
    const driver = new EnvDriver({ envPrefix: undefined });
    driver.load();
    // Both prefixed and unprefixed should be available
    expect(driver.get('APP_NAME')).toBe('MyApp');
    expect(driver.get('VITE_APP_NAME')).toBe('MyApp');
  });

  it('should strip custom prefix', () => {
    process.env.MYAPP_HOST = 'localhost';
    const driver = new EnvDriver({ envPrefix: 'MYAPP_' });
    driver.load();
    expect(driver.get('HOST')).toBe('localhost');
    expect(driver.get('MYAPP_HOST')).toBe('localhost');
  });

  it('should not strip prefix when envPrefix is false', () => {
    process.env.VITE_PORT = '3000';
    const driver = new EnvDriver({ envPrefix: false });
    driver.load();
    expect(driver.get('VITE_PORT')).toBe('3000');
    expect(driver.get('PORT')).toBeUndefined();
  });

  // Property: Variable Expansion
  describe('expandVariables', () => {
    it('should expand ${VAR} references', () => {
      process.env.BASE_URL = 'https://api.example.com';
      process.env.API_ENDPOINT = '${BASE_URL}/v1';
      const driver = new EnvDriver({ expandVariables: true, envPrefix: false });
      driver.load();
      expect(driver.get('API_ENDPOINT')).toBe('https://api.example.com/v1');
    });

    it('should resolve to empty string for non-existent references', () => {
      process.env.TEMPLATE = 'Hello ${MISSING_VAR}!';
      const driver = new EnvDriver({ expandVariables: true, envPrefix: false });
      driver.load();
      expect(driver.get('TEMPLATE')).toBe('Hello !');
    });

    it('should not expand when expandVariables is false', () => {
      process.env.KEEP_RAW = '${SOME_VAR}';
      const driver = new EnvDriver({ expandVariables: false, envPrefix: false });
      driver.load();
      expect(driver.get('KEEP_RAW')).toBe('${SOME_VAR}');
    });
  });

  it('should support merge()', () => {
    const driver = new EnvDriver({ envPrefix: false });
    driver.load();
    driver.merge({ CUSTOM_KEY: 'custom_value' });
    expect(driver.get('CUSTOM_KEY')).toBe('custom_value');
  });

  it('should support set()', () => {
    const driver = new EnvDriver({ envPrefix: false });
    driver.load();
    driver.set('RUNTIME_KEY', 'runtime_value');
    expect(driver.get('RUNTIME_KEY')).toBe('runtime_value');
  });

  it('should support delete()', () => {
    process.env.TO_DELETE = 'value';
    const driver = new EnvDriver({ envPrefix: false });
    driver.load();
    expect(driver.get('TO_DELETE')).toBe('value');
    driver.delete('TO_DELETE');
    expect(driver.get('TO_DELETE')).toBeUndefined();
  });

  it('should report has() correctly', () => {
    process.env.EXISTS = 'yes';
    const driver = new EnvDriver({ envPrefix: false });
    driver.load();
    expect(driver.has('EXISTS')).toBe(true);
    expect(driver.has('NOPE')).toBe(false);
  });
});
