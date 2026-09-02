/**
 * @file registry-claims.interface.ts
 * @description Verified JWT claims consumed by Registry authorization guards.
 */
import type { JWTPayload } from 'jose';

/**
 * Claims accepted after signature, issuer, and audience verification.
 */
export interface RegistryClaims extends JWTPayload {
  /** Stable principal identifier. */
  readonly sub: string;
  /** Service credential/session identifier. */
  readonly sid?: string;
  /** Principal classification. */
  readonly principal_type?: string;
  /** IAM permissions carried by a service token. */
  readonly permissions?: readonly string[];
}
