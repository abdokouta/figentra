import { Injectable } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RegistryModuleDefinition, RegistryResource, RegistryAction, RegistryNavigation } from '../../src/registry.decorators.js';
import { RegistryDiscoveryService } from '../../src/registry.discovery.js';

@RegistryModuleDefinition({ key: 'identity' })
@RegistryResource({ key: 'users', moduleKey: 'identity' })
@RegistryAction({ key: 'read', resourceKey: 'users', permission: 'identity:users:read' })
@RegistryNavigation({ key: 'users', path: '/users', permission: 'identity:users:read' })
@Injectable()
class IdentityRegistryMetadata {}

describe('RegistryDiscoveryService', () => {
  it('collects decorator metadata from discovered providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [IdentityRegistryMetadata, RegistryDiscoveryService],
    }).compile();

    const service = moduleRef.get(RegistryDiscoveryService);
    const records = service.collect();

    expect(records).toHaveLength(4);
    expect(records.map((record) => record.kind)).toEqual(
      expect.arrayContaining(['module', 'resource', 'action', 'navigation']),
    );

    await moduleRef.close();
  });
});
