import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import type { HealthIndicator } from "../../core/contracts/health.types.js";
import type { HealthServiceContract } from "../../core/services/health.service.types.js";
import { HEALTH_SERVICE } from "../../core/constants/health.tokens.js";
import { getHealthIndicatorMetadata } from "./health-indicator.decorator.js";
@Injectable()
export class HealthIndicatorLoader implements OnModuleInit {
  private readonly logger = new Logger(HealthIndicatorLoader.name);
  constructor(private readonly discovery: DiscoveryService, @Inject(HEALTH_SERVICE) private readonly health: HealthServiceContract) {}
  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders()) {
      if (!wrapper.instance || !wrapper.metatype) continue;
      const metadata = getHealthIndicatorMetadata(wrapper.metatype);
      if (!metadata || this.health.registry.get(metadata.name)) continue;
      this.health.register({ ...metadata, check: (context) => (wrapper.instance as HealthIndicator).check(context) });
      this.logger.debug(`Registered health indicator '${metadata.name}'`);
    }
  }
}
