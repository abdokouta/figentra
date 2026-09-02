import { describe, expect, it } from 'vitest';
import {
  RegistryEvent,
  RegistryFeature,
  RegistryWorkflow,
} from '../../src/registry.decorators.js';
import { REGISTRY_DISCOVERY_METADATA } from '../../src/registry.decorators.js';

@RegistryWorkflow({
  key: 'identity.sync-users',
  version: '1',
  runtime: 'cloudflare-workflow',
  worker: 'workflow-runtime',
})
@RegistryEvent({
  key: 'identity.users.synced',
  direction: 'produces',
  topic: 'identity.users.synced',
})
@RegistryFeature({ key: 'identity.bulk-sync', defaultEnabled: true })
class RegistryMetadataFixture {}

describe('registry catalog decorators', () => {
  it('collects first-class day-one categories as metadata', () => {
    const records = Reflect.getMetadata(REGISTRY_DISCOVERY_METADATA, RegistryMetadataFixture) as Array<{ kind: string }>;
    expect(records.map((record) => record.kind)).toEqual(['feature', 'event', 'workflow']);
  });
});
