/** @file token-exchange.service.ts @description Identity S2S token exchange adapter. */
import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { GATEWAY_CONFIG } from "../modules/gateway.config.module.js";
import { HttpServiceTransport } from "@stackra/network";
import type { GatewayActorContext } from "../types/request-context.type.js";
import type { GatewayConfig } from "../config/gateway.config.js";

/** Response from Identity's authenticated downstream-token exchange. */
interface TokenExchangeResponse {
  /** Short-lived signed token for the target audience. */
  readonly accessToken: string;
  /** Expiry time in seconds. */
  readonly expiresIn: number;
}

/** Exchanges Gateway identity for an audience-bound downstream token. */
@Injectable()
export class GatewayTokenExchangeService {
  private readonly transport: HttpServiceTransport;

  /** Creates the Identity S2S transport. */
  public constructor(@Inject(GATEWAY_CONFIG) config: GatewayConfig) {
    this.transport = new HttpServiceTransport({ service: "identity", baseUrl: config.identityServiceUrl, timeoutMs: config.upstreamTimeoutMs, maxRetries: 0, getAccessToken: () => config.gatewayServiceToken });
  }

  /** Requests a short-lived token for one registered service audience. */
  public async exchange(actor: GatewayActorContext, audience: string): Promise<string> {
    try {
      const result = await this.transport.request<TokenExchangeResponse>("POST", "/api/v1/tokens/exchange", {
        body: { subject: actor.principalId, sessionId: actor.tokenId, tenantId: actor.tenantId, scopes: actor.scopes, permissions: actor.permissions, audience },
      });
      if (!result.accessToken || !Number.isFinite(result.expiresIn) || result.expiresIn <= 0) throw new Error("Invalid token exchange response");
      return result.accessToken;
    } catch {
      throw new ServiceUnavailableException("Identity token exchange unavailable");
    }
  }
}
