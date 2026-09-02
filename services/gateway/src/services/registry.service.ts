/**
 * @file registry.service.ts
 * @description Gateway S2S route-resolution adapter using @figentra/registry-worker-sdk.
 */

import {
  Injectable,
  Inject,
  Optional,
  ServiceUnavailableException,
  NotFoundException,
} from "@nestjs/common";
import { RegistryClientService, RegistryClientError } from "@figentra/registry-worker-sdk";
import { GATEWAY_CONFIG } from "../modules/gateway.config.module";
import type { ServiceRoute } from "../interfaces/service-route.interface";
import type { GatewayConfig } from "../config/gateway.config";

/**
 * Resolves public routes using the Application Registry Worker as the authoritative route store.
 */
@Injectable()
export class GatewayRegistryService {
  public constructor(
    @Inject(GATEWAY_CONFIG)
    private readonly config: GatewayConfig,

    @Optional()
    private readonly registryClient?: RegistryClientService,
  ) {}

  /**
   * Resolves an HTTP route for the given method and path against the Registry Worker.
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - Incoming request path
   * @returns Resolved ServiceRoute upstream descriptor
   * @throws NotFoundException if route is not registered
   * @throws ServiceUnavailableException if registry is unreachable
   */
  public async resolve(method: string, path: string): Promise<ServiceRoute> {
    try {
      if (this.registryClient) {
        const resolved = await this.registryClient.resolveRoute(method, path);
        return {
          id: resolved.id ?? `${method}:${path}`,
          upstream: resolved.upstream,
          audience: resolved.audience,
          requiredPermission: resolved.requiredPermission,
          metadata: resolved.metadata,
        };
      }

      // Direct fallback using configured registryServiceUrl
      const url = `${this.config.registryServiceUrl.replace(/\/$/, "")}/v1/routes/resolve?method=${encodeURIComponent(method)}&path=${encodeURIComponent(path)}`;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (this.config.gatewayServiceToken) {
        headers["Authorization"] = `Bearer ${this.config.gatewayServiceToken}`;
      }

      const res = await fetch(url, { headers });
      if (res.status === 404) {
        throw new NotFoundException(`No route found for ${method} ${path}`);
      }
      if (!res.ok) {
        throw new ServiceUnavailableException("Route registry unavailable");
      }

      const data = (await res.json()) as ServiceRoute;
      return data;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof RegistryClientError && error.status === 404) {
        throw new NotFoundException(`No route found for ${method} ${path}`);
      }
      throw new ServiceUnavailableException("Route registry unavailable");
    }
  }
}
