import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import { HttpDriver } from '@/core/drivers';

/**
 * Integration test for the HttpDriver using a real local HTTP server.
 */
describe('HttpDriver (integration)', () => {
  let server: Server;
  let baseUrl: string;
  let configData: Record<string, unknown>;

  beforeAll(async () => {
    configData = {
      app: { name: 'TestApp', version: '1.0.0' },
      features: { darkMode: true, beta: false },
      limits: { maxUpload: 10485760 },
    };

    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://127.0.0.1`);
      if (url.pathname === '/config') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(configData));
      } else if (url.pathname === '/error') {
        res.writeHead(500);
        res.end('Internal Server Error');
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(() => {
    server.close();
  });

  it('should fetch and parse JSON config from endpoint', async () => {
    const driver = new HttpDriver({ url: `${baseUrl}/config` });
    await driver.load();

    expect(driver.get('app.name')).toBe('TestApp');
    expect(driver.get('app.version')).toBe('1.0.0');
    expect(driver.get('features.darkMode')).toBe(true);
    expect(driver.get('limits.maxUpload')).toBe(10485760);
  });

  it('should return default for non-existent keys', async () => {
    const driver = new HttpDriver({ url: `${baseUrl}/config` });
    await driver.load();

    expect(driver.get('missing', 'fallback')).toBe('fallback');
    expect(driver.get('app.nonexistent', 42)).toBe(42);
  });

  it('should report has() correctly', async () => {
    const driver = new HttpDriver({ url: `${baseUrl}/config` });
    await driver.load();

    expect(driver.has('app')).toBe(true);
    expect(driver.has('app.name')).toBe(true);
    expect(driver.has('missing')).toBe(false);
  });

  it('should return all config', async () => {
    const driver = new HttpDriver({ url: `${baseUrl}/config` });
    await driver.load();

    const all = driver.all();
    expect(all).toEqual(configData);
  });

  it('should throw ConfigSourceError on HTTP failure', async () => {
    const driver = new HttpDriver({ url: `${baseUrl}/error` });
    await expect(driver.load()).rejects.toThrow(/500/);
  });

  it('should throw ConfigSourceError on 404', async () => {
    const driver = new HttpDriver({ url: `${baseUrl}/not-found` });
    await expect(driver.load()).rejects.toThrow(/404/);
  });

  it('should support query parameters', async () => {
    const driver = new HttpDriver({
      url: `${baseUrl}/config`,
      query: { format: 'json' },
    });
    await driver.load();
    expect(driver.get('app.name')).toBe('TestApp');
  });

  it('should support refresh', async () => {
    const driver = new HttpDriver({ url: `${baseUrl}/config` });
    await driver.load();

    // Mutate the server data
    configData.app = { name: 'UpdatedApp', version: '2.0.0' };

    await driver.refresh!();
    expect(driver.get('app.name')).toBe('UpdatedApp');
    expect(driver.get('app.version')).toBe('2.0.0');

    // Restore
    configData.app = { name: 'TestApp', version: '1.0.0' };
  });

  it('should support merge after load', async () => {
    const driver = new HttpDriver({ url: `${baseUrl}/config` });
    await driver.load();

    driver.merge!({ extra: { key: 'value' } });
    expect(driver.get('extra.key')).toBe('value');
    expect(driver.get('app.name')).toBe('TestApp'); // Original preserved
  });

  it('should record last fetched timestamp', async () => {
    const driver = new HttpDriver({ url: `${baseUrl}/config` });
    expect(driver.getLastFetchedAt()).toBeNull();

    await driver.load();
    expect(driver.getLastFetchedAt()).toBeInstanceOf(Date);
  });

  it('should dispose refresh timer', async () => {
    const driver = new HttpDriver({
      url: `${baseUrl}/config`,
      refreshInterval: 60000,
    });
    await driver.load();

    // Should not throw
    driver.dispose!();
  });
});
