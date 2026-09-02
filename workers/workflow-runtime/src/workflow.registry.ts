import type { WorkflowHandler } from './workflow.types.js';

const handlers = new Map<string, WorkflowHandler>();

/** Registers executable workflow code into this Worker bundle. */
export function registerWorkflow(handler: WorkflowHandler): void {
  const id = `${handler.key}@${handler.version}`;
  if (handlers.has(id)) throw new Error(`Duplicate workflow registration: ${id}`);
  handlers.set(id, handler);
}

/** Resolves an executable workflow by immutable key/version. */
export function resolveWorkflow(key: string, version?: string): WorkflowHandler | undefined {
  if (version) return handlers.get(`${key}@${version}`);
  const matches = [...handlers.values()].filter((handler) => handler.key === key);
  return matches.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))[0];
}

/** Returns the immutable executable workflow inventory bundled into this Worker. */
export function listRegisteredWorkflows(): Array<Pick<WorkflowHandler, 'key' | 'version'>> {
  return [...handlers.values()].map(({ key, version }) => ({ key, version }));
}
