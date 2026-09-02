/**
 * @file observability-options.interface.ts
 * @description Configuration contract for one NestJS workload.
 */
export interface FigentraObservabilityOptions {
  /** Stable service identifier. */
  readonly serviceId: string;
  /** Deployed release version. */
  readonly serviceVersion: string;
  /** Optional Observe endpoint override. */
  readonly endpoint?: string;
  /** Enables Observe diagnostics. */
  readonly debug?: boolean;
}
