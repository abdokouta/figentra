/** @file iam.service.ts @description Gateway IAM decision adapter. */
import { ForbiddenException, Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { GATEWAY_CONFIG } from "../modules/gateway.config.module.js";
import { HttpServiceTransport } from "@stackra/network";
import type { GatewayActorContext } from "../types/request-context.type.js";
import type { GatewayConfig } from "../config/gateway.config.js";

/** Calls IAM for authoritative permission decisions. */
@Injectable()
export class GatewayIamService {
  private readonly transport: HttpServiceTransport;

  /** Creates an authenticated IAM transport. */
  public constructor(@Inject(GATEWAY_CONFIG) config: GatewayConfig) {
    this.transport = new HttpServiceTransport({ service: "iam", baseUrl: config.iamServiceUrl, timeoutMs: config.upstreamTimeoutMs, maxRetries: 1, getAccessToken: () => config.gatewayServiceToken });
  }

  /** Fails closed unless IAM explicitly permits the operation. */
  public async authorize(actor: GatewayActorContext, permission: string): Promise<void> {
    try {
      const result = await this.transport.request<{ allowed: boolean }>("POST", "/api/v1/authorization/check", {
        body: { context: { principalId: actor.principalId, serviceId: "gateway", tenantId: actor.tenantId, scopes: actor.scopes, permissions: actor.permissions, tokenId: actor.tokenId }, permission },
      });
      if (result.allowed !== true) throw new ForbiddenException("Operation is not authorized");
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ServiceUnavailableException("Authorization service unavailable");
    }
  }
}
