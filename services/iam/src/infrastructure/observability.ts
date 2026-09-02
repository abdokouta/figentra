/**
 * @file observability.ts
 * @description Service-specific binding to the shared Figentra NestJS Observe
 * and Devtools platform. This file contains no telemetry implementation; it
 * only binds the immutable service identifier to the shared integration.
 */
import {
  createFigentraDevtoolsModule,
  createFigentraObservability,
} from "@figentra/observability/nest";

/** Stable Observe identity for the iam deployable. */
export const { ObserveModule, ObserveInstrument } = createFigentraObservability({
  serviceId: "iam",
});

/** Securely opt-in Devtools integration for development/CI diagnostics. */
export const DevtoolsModule = createFigentraDevtoolsModule();
