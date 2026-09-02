import { Injectable } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Before, Step, Workflow } from '../../src/decorators/index.js';
import { WorkflowDiscoveryService } from '../../src/nest/workflow.discovery.service.js';

@Workflow('test-workflow', { version: '1' })
@Injectable()
class TestWorkflow {
  @Step('one')
  async one(): Promise<string> { return 'ok'; }
  @Before()
  async before(): Promise<void> {}
}

describe('WorkflowDiscoveryService', () => {
  it('discovers workflows, steps, and hooks', async () => {
    const ref = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [TestWorkflow, WorkflowDiscoveryService],
    }).compile();
    const service = ref.get(WorkflowDiscoveryService);
    const [workflow] = service.collect();
    expect(workflow.metadata.name).toBe('test-workflow');
    expect(workflow.steps.map((x) => x.name)).toEqual(['one']);
    expect(workflow.hooks).toHaveLength(1);
    await ref.close();
  });
});
