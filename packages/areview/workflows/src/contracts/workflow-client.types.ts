export type { WorkflowStartRequest, WorkflowExecution, WorkflowSignalRequest } from './workflow.types.js';

/** Provider-neutral workflow runtime client configuration. */
export interface WorkflowClientOptions {
  provider: import('./workflow.types.js').WorkflowProvider;
}
