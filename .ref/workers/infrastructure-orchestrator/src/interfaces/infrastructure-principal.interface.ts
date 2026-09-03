/**
 * @file infrastructure-principal.interface.ts
 * @description Verified principal contract for infrastructure mutations.
 */
import type { JWTPayload } from 'jose';

/**
 * Minimal verified principal accepted by the infrastructure control plane.
 */
export interface InfrastructurePrincipal extends JWTPayload {
  /** Stable principal identifier. */
  readonly sub: string;
  /** IAM permissions granted to the principal. */
  readonly permissions?: readonly string[];
}
