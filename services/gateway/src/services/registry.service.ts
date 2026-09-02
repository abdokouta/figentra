/** @file registry.service.ts @description Registry S2S route-resolution adapter. */
import { Injectable, Inject, ServiceUnavailableException } from "@nestjs/common";
import { GATEWAY_CONFIG } from "../modules/gateway.config.module.js";
import { HttpServiceTransport } from "@stackra/network";
import type { ServiceRoute } from "../interfaces/service-route.interface.js";
import type { GatewayConfig } from "../config/gateway.config.js";

/** Resolves public routes using Registry as the sole route authority. */
@Injectable()
export class GatewayRegistryService {
  private readonly transport: HttpServiceTransport;

  /** Creates an authenticated Registry transport. */
  public constructor(@Inject(GATEWAY_CONFIG) config: GatewayConfig) {
    this.transport = new HttpServiceTransport({ service: "registry", baseUrl: config.registryServiceUrl, timeoutMs: config.upstreamTimeoutMs, maxRetries: config.upstreamMaxRetries, getAccessToken: () => config.gatewayServiceToken });
  }

  /** Resolves an HTTP route for the given method and path. */
  public async resolve(method: string, path: string): Promise<ServiceRoute> {
    try {
      return await this.transport.request<ServiceRoute>("GET", `/v1/routes/resolve?method=${encodeURIComponent(method)}&path=${encodeURIComponent(path)}`);
    } catch {
      throw new ServiceUnavailableException("Route registry unavailable");
    }
  }
}
