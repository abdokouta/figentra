/** @file gateway.controller.ts @description Public API Gateway controller. */
import { All, Controller, Param, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { GatewayRegistryService } from "../services/registry.service";
import { GatewayIamService } from "../services/iam.service";
import { GatewayUpstreamService } from "../services/upstream.service";
import type { AuthenticatedGatewayRequest } from "../interfaces/authenticated-request.interface";

/** Routes authenticated public API calls to Registry-resolved services. */
@Controller("v1")
export class GatewayController {
  /** Creates the Gateway controller with its platform adapters. */
  public constructor(private readonly registry: GatewayRegistryService, private readonly iam: GatewayIamService, private readonly upstream: GatewayUpstreamService) { }

  /** Forwards any versioned service path after authentication and authorization. */
  @All(":service/*splat")
  public async proxy(@Param("service") service: string, @Req() request: AuthenticatedGatewayRequest, @Res() reply: FastifyReply): Promise<void> {
    if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(service)) throw new Error("Invalid service name");
    const actor = request.gatewayContext?.actor;
    if (!actor) throw new Error("Gateway actor context missing");
    const route = await this.registry.resolve(request.method, request.url);
    const declaredService = typeof route.metadata?.service === "string" ? route.metadata.service : service;
    if (declaredService !== service) throw new Error("Resolved route service mismatch");
    if (route.requiredPermission) await this.iam.authorize(actor, route.requiredPermission);
    await this.upstream.forward(request, reply, route, actor);
  }
}
