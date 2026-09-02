import { describe, expect, it } from 'vitest';
import { listRegisteredWorkflows, registerWorkflow, resolveWorkflow } from '../src/workflow.registry.js';

describe('workflow registry', () => {
  it('registers and resolves immutable workflow versions', () => {
    const handler = { key: 'test', version: '1', async run() { return 'ok'; } };
    registerWorkflow(handler);
    expect(resolveWorkflow('test', '1')).toBe(handler);
    expect(listRegisteredWorkflows()).toContainEqual({ key: 'test', version: '1' });
  });
});
