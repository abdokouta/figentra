import { DynamicModule, Module, Provider } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { defineHealthService, type CreateHealthServiceOptions } from "../core/services/health.service.js";
import { HEALTH_SERVICE } from "../core/constants/health.tokens.js";
import { defineHealthController, type HealthControllerOptions } from "./controllers/health.controller.js";
import { HealthIndicatorLoader } from "./discovery/indicator-loader.service.js";
import type { HealthServiceContract } from "../core/services/health.service.types.js";
export interface NestHealthModuleOptions extends CreateHealthServiceOptions, HealthControllerOptions { readonly discovery?: boolean; }
@Module({})
export class HealthModule {
  static forRoot(options: NestHealthModuleOptions = { path: "health" }): DynamicModule {
    const service = defineHealthService(options);
    const serviceProvider: Provider = { provide: HEALTH_SERVICE, useValue: service };
    const controller = defineHealthController(service, { path: options.path ?? "health" });
    return { module: HealthModule, imports: [DiscoveryModule], providers: [serviceProvider, ...(options.discovery === false ? [] : [HealthIndicatorLoader])], controllers: [controller], exports: [serviceProvider] };
  }
}
export function getHealthService(module: { get<T>(token: string | symbol): T }): HealthServiceContract { return module.get<HealthServiceContract>(HEALTH_SERVICE); }
