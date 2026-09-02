/**
 * @file orchestrator-variables.interface.ts
 * @description Request-local Hono variables for the Infrastructure Orchestrator.
 */
import type { InfrastructurePrincipal } from "./infrastructure-principal.interface.js";

/**
 * Request-local state established by Orchestrator middleware.
 */
export interface OrchestratorVariables {
  /** Stable request identifier. */
  readonly requestId: string;
  /** Distributed correlation identifier. */
  readonly correlationId: string;
  /** Verified caller principal. */
  readonly principal: InfrastructurePrincipal;
}
