/**
 * @file index.ts
 * @description Cloudflare Worker entrypoint for infrastructure orchestration.
 */
import { createInfrastructureOrchestrator } from './app.js';

/**
 * Default Worker export.
 */
const app = createInfrastructureOrchestrator();
/** Public exported symbol. */
export default app;

/** Public barrel export. */
export { TerraformRunner } from './terraform-runner.js';

/** Public barrel export. */
export { InfrastructureWorkflow } from './workflows/infrastructure.workflow.js';
