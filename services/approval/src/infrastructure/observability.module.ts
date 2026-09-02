/**
 * @file observability.module.ts
 * @description Approval service binding to shared observability.
 */
import { Module } from "@nestjs/common";
import { FigentraDevtoolsModule, FigentraObservabilityModule } from "@figentra/observability/nest";
import { SERVICE_NAME, SERVICE_VERSION } from "../constants/service.constant";

/** Approval service observability composition. */
@Module({
  imports: [
    FigentraObservabilityModule.forRoot({ serviceId: SERVICE_NAME, serviceVersion: SERVICE_VERSION }),
    FigentraDevtoolsModule.register(),
  ],
  exports: [FigentraObservabilityModule, FigentraDevtoolsModule],
})
/** Public symbol `ObservabilityModule`. */
export class ObservabilityModule { }
