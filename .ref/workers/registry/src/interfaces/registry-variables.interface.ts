/**
 * @file registry-variables.interface.ts
 * @description Request-local Hono variables for the Application Registry.
 */
import type { RegistryClaims } from "./registry-claims.interface";

/**
 * Request-local state established by Registry middleware.
 */
export interface RegistryVariables {
  /** Stable request identifier. */
  readonly requestId: string;
  /** Distributed correlation identifier. */
  readonly correlationId: string;
  /** Verified caller claims. */
  readonly registryClaims: RegistryClaims;
}
