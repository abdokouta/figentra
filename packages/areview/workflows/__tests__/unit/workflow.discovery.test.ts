import { Injectable } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Step, Workflow } from '../../src/decorators/index';
import { WorkflowDiscoveryService } from '../../src/nest/workflow.discovery.service';

@Workflow('test-workflow', { version: '1' })
@Injectable()
class TestWorkflow {
  @Step('one', { compensateMethod: 'compensate' }) async one(): Promise<string> { return 'ok'; }
  async compensate(): Promise<void> { }
}

describe('WorkflowDiscoveryService', () => {
  it('discovers and compiles workflows as explicit durable steps', async () => {
    const ref = await Test.createTestingModule({ imports: [DiscoveryModule], providers: [TestWorkflow, WorkflowDiscoveryService] }).compile();
    const service = ref.get(WorkflowDiscoveryService);
    const [workflow] = service.collect();
    expect(workflow.metadata.name).toBe('test-workflow');
    expect(workflow.steps.map((x) => x.name)).toEqual(['one']);
    const definition = service.compile(ref.get(TestWorkflow));
    expect(definition.steps[0]?.name).toBe('one');
    await ref.close();
  });
});
