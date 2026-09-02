/** @file upstream.service.ts @description Authenticated upstream proxy service. */
import { BadGatewayException, Inject, Injectable, GatewayTimeoutException } from "@nestjs/common";
import { GATEWAY_CONFIG } from "../modules/gateway.config.module";
import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpServiceTransport } from "@stackra/network";
import type { ServiceRoute } from "../interfaces/service-route.interface";
import type { GatewayConfig } from "../config/gateway.config";
import type { GatewayActorContext } from "../types/request-context.type";
import { GatewayTokenExchangeService } from "./token-exchange.service";

/** Proxies validated requests to an authenticated registered service. */
@Injectable()
export class GatewayUpstreamService {
  /** Creates the upstream proxy service. */
  public constructor(@Inject(GATEWAY_CONFIG) private readonly config: GatewayConfig, private readonly tokenExchange: GatewayTokenExchangeService) { }

  /** Forwards one request using an audience-bound token and safe headers. */
  public async forward(request: FastifyRequest, reply: FastifyReply, route: ServiceRoute, actor: GatewayActorContext): Promise<void> {
    const token = await this.tokenExchange.exchange(actor, route.audience);
    const transport = new HttpServiceTransport({ service: route.audience, baseUrl: route.upstream, timeoutMs: this.config.upstreamTimeoutMs, maxRetries: this.config.upstreamMaxRetries, getAccessToken: () => token });
    const url = new URL(request.url, "http://gateway.local");
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.headers)) {
      if (!value || ["host", "content-length", "connection", "authorization", "cookie"].includes(key)) continue;
      headers[key] = Array.isArray(value) ? value.join(",") : value;
    }
    try {
      const body = ["GET", "HEAD", "OPTIONS"].includes(request.method) ? undefined : request.body;
      const payload = await transport.request<unknown>(request.method, `${url.pathname}${url.search}`, { headers, body });
      reply.send(payload);
    } catch (error) {
      const status = error instanceof Error && "status" in error ? Number((error as { status?: unknown }).status) : 502;
      if (status === 408 || status === 504) throw new GatewayTimeoutException("Upstream service timed out");
      throw new BadGatewayException("Upstream service request failed");
    }
  }
}
