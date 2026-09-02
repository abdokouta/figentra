import { describe, expect, it } from 'vitest';
import { Before, Step, Workflow } from '../../src/decorators/index.js';
import { WORKFLOW_HOOK_METADATA, WORKFLOW_METADATA, WORKFLOW_STEP_METADATA } from '../../src/decorators/metadata.js';

@Workflow('identity.sync-users', { version: '1' })
class WorkflowFixture {
  @Before('sync')
  async validate(): Promise<void> {}

  @Step('sync')
  async sync(): Promise<void> {}
}

describe('workflow decorators', () => {
  it('keeps hooks step-local', () => {
    expect(Reflect.getMetadata(WORKFLOW_METADATA, WorkflowFixture).name).toBe('identity.sync-users');
    expect(Reflect.getMetadata(WORKFLOW_STEP_METADATA, WorkflowFixture.prototype, 'sync').name).toBe('sync');
    expect(Reflect.getMetadata(WORKFLOW_HOOK_METADATA, WorkflowFixture)).toEqual([
      expect.objectContaining({ type: 'before', step: 'sync', method: 'validate' }),
    ]);
  });
});
