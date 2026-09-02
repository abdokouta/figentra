import { describe, expect, it } from 'vitest';
import { Step, Workflow } from '../../src/decorators/index.js';
import { WORKFLOW_METADATA, WORKFLOW_STEP_METADATA } from '../../src/decorators/metadata.js';

@Workflow('identity.sync-users', { version: '1' })
class WorkflowFixture {
  @Step('sync', { compensateMethod: 'compensate' }) async sync(): Promise<void> {}
  async compensate(): Promise<void> {}
}

describe('workflow decorators', () => {
  it('keeps durable steps explicit', () => {
    expect(Reflect.getMetadata(WORKFLOW_METADATA, WorkflowFixture).name).toBe('identity.sync-users');
    expect(Reflect.getMetadata(WORKFLOW_STEP_METADATA, WorkflowFixture.prototype, 'sync')).toEqual(expect.objectContaining({ name: 'sync', compensateMethod: 'compensate' }));
  });
});
