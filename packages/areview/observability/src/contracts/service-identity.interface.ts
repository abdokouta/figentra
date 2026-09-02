/**
 * @file service-identity.interface.ts
 * @description Stable runtime identity metadata for Figentra deployables.
 */

/**
 * Identifies the application/service and immutable deployment version.
 */
export interface ServiceIdentity {
  /** Stable Figentra service or application slug. */
  readonly serviceId: string;
  /** Immutable release identifier, normally the Git SHA. */
  readonly serviceVersion: string;
  /** Deployment environment. */
  readonly environment: "development" | "staging" | "production";
}
