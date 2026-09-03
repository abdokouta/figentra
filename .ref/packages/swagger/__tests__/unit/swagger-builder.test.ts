import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwaggerBuilderService } from '@/services/swagger-builder.service';
import { SWAGGER_CONFIG_TOKEN } from '@/constants';
import type { ISwaggerConfig } from '@/interfaces';

const BASE_CONFIG: ISwaggerConfig = {
  title: 'Test API',
  description: 'Test description',
  version: '2.0.0',
  apiPath: 'api/docs',
  enabled: true,
  serverUrl: 'http://localhost:3000',
};

describe('SwaggerBuilderService', () => {
  let service: SwaggerBuilderService;

  beforeEach(() => {
    service = new (SwaggerBuilderService as any)(BASE_CONFIG);
    // Manually set the injected config (simulating DI)
    (service as any).config = BASE_CONFIG;
  });

  it('builds a document with title, description, version', () => {
    const doc = service.build();

    expect(doc.info.title).toBe('Test API');
    expect(doc.info.description).toBe('Test description');
    expect(doc.info.version).toBe('2.0.0');
  });

  it('adds the primary server', () => {
    const doc = service.build();

    expect(doc.servers).toBeDefined();
    expect(doc.servers!.length).toBeGreaterThanOrEqual(1);
    expect(doc.servers![0].url).toBe('http://localhost:3000');
  });

  it('adds additional servers', () => {
    (service as any).config = {
      ...BASE_CONFIG,
      additionalServers: [
        { url: 'https://staging.api.com', description: 'Staging' },
        { url: 'https://prod.api.com', description: 'Production' },
      ],
    };

    const doc = service.build();

    expect(doc.servers!.length).toBe(3);
    expect(doc.servers![1].url).toBe('https://staging.api.com');
    expect(doc.servers![2].url).toBe('https://prod.api.com');
  });

  it('adds contact information', () => {
    (service as any).config = {
      ...BASE_CONFIG,
      contactName: 'API Team',
      contactEmail: 'team@test.com',
      contactUrl: 'https://test.com',
    };

    const doc = service.build();

    expect(doc.info.contact).toBeDefined();
    expect(doc.info.contact!.name).toBe('API Team');
    expect(doc.info.contact!.email).toBe('team@test.com');
  });

  it('adds license information', () => {
    (service as any).config = {
      ...BASE_CONFIG,
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    };

    const doc = service.build();

    expect(doc.info.license).toBeDefined();
    expect(doc.info.license!.name).toBe('MIT');
  });

  it('adds JWT bearer auth when security.jwt.enabled', () => {
    (service as any).config = {
      ...BASE_CONFIG,
      security: {
        jwt: { enabled: true, name: 'JWT-auth', description: 'JWT token' },
        apiKey: { enabled: false, name: 'api-key', headerName: 'X-API-KEY', description: '' },
      },
    };

    const doc = service.build();

    expect(doc.components?.securitySchemes).toBeDefined();
    expect(doc.components!.securitySchemes!['JWT-auth']).toBeDefined();
  });

  it('adds API key auth when security.apiKey.enabled', () => {
    (service as any).config = {
      ...BASE_CONFIG,
      security: {
        jwt: { enabled: false, name: 'JWT-auth', description: '' },
        apiKey: { enabled: true, name: 'api-key', headerName: 'X-API-KEY', description: 'API Key' },
      },
    };

    const doc = service.build();

    expect(doc.components?.securitySchemes?.['api-key']).toBeDefined();
  });

  it('skips auth schemes when security is not provided', () => {
    (service as any).config = { ...BASE_CONFIG };

    const doc = service.build();

    // No security schemes added when config.security is undefined
    const schemes = doc.components?.securitySchemes ?? {};
    expect(Object.keys(schemes).length).toBe(0);
  });

  it('adds tags', () => {
    (service as any).config = {
      ...BASE_CONFIG,
      tags: [
        { name: 'users', description: 'User endpoints' },
        { name: 'products', description: 'Product endpoints' },
      ],
    };

    const doc = service.build();

    expect(doc.tags).toBeDefined();
    expect(doc.tags!.length).toBe(2);
    expect(doc.tags![0].name).toBe('users');
    expect(doc.tags![1].name).toBe('products');
  });
});
