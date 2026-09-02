/** @file service-route.interface.ts @description Registry-resolved upstream route contract. */

/** Authoritative route returned by Registry. */
export interface ServiceRoute {
  /** Stable route identifier. */
  readonly id: string;
  /** Absolute HTTPS upstream origin. */
  readonly upstream: string;
  /** Target service audience. */
  readonly audience: string;
  /** Optional required permission. */
  readonly requiredPermission?: string;
  /** Optional route metadata. */
  readonly metadata?: Record<string, unknown>;
}
