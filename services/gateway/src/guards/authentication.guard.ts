/** @file authentication.guard.ts @description Gateway JWT authentication guard. */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import { PUBLIC_PATHS } from "../constants/gateway.constant";
import { GatewayJwtVerifierService } from "../security/jwt-verifier.service";
import type { AuthenticatedGatewayRequest } from "../interfaces/authenticated-request.interface";
import { REQUEST_CONTEXT } from "../interceptors/request-context.interceptor";

/** Marks an endpoint as intentionally public. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata("gatewayPublic", true);

/** Authenticates every non-public Gateway request. */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  /** Creates the authentication guard. */
  public constructor(private readonly verifier: GatewayJwtVerifierService, private readonly reflector: Reflector) { }

  /** Verifies the bearer token and stores trusted actor context. */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedGatewayRequest>();
    if (this.reflector.getAllAndOverride<boolean>("gatewayPublic", [context.getHandler(), context.getClass()])) return true;
    if (PUBLIC_PATHS.includes(request.url.split("?")[0] as (typeof PUBLIC_PATHS)[number])) return true;
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException("Bearer access token required");
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) throw new UnauthorizedException("Bearer access token required");
    const actor = await this.verifier.verify(token);
    request.gatewayContext = {
      requestId: String(request.headers["x-request-id"]),
      correlationId: String(request.headers["x-correlation-id"]),
      traceparent: typeof request.headers.traceparent === "string" ? request.headers.traceparent : undefined,
      actor,
    };
    return true;
  }
}
