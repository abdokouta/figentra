import { describe, expect, it, vi } from 'vitest';
import { RegistryService } from '../../src/registry.service.js';

describe('RegistryService', () => {
  it('composes a canonical registry manifest from feature inventory', () => {
    const service = new RegistryService({
      application: 'identity',
      version: '1.2.3',
      registryUrl: 'https://registry.example.com',
    });
    service.addFeature({
      modules: [{ key: 'identity' }],
      resources: [{ key: 'users', moduleKey: 'identity' }],
      actions: [{ key: 'read', resourceKey: 'users', permission: 'identity:users:read' }],
      navigation: [{ key: 'users', path: '/users' }],
    });
    expect(service.getManifest()).toMatchObject({
      slug: 'identity',
      version: '1.2.3',
      modules: [{ key: 'identity' }],
      resources: [{ key: 'users', moduleKey: 'identity' }],
      actions: [{ key: 'read', resourceKey: 'users', permission: 'identity:users:read' }],
      navigation: [{ key: 'users', path: '/users' }],
    });
    vi.restoreAllMocks();
  });
});
