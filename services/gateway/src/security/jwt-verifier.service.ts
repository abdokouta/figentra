/** @file jwt-verifier.service.ts @description External access-token verification. */
import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { GATEWAY_CONFIG } from "../modules/gateway.config.module";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { GatewayActorContext } from "../types/request-context.type";
import type { GatewayConfig } from "../config/gateway.config";

/** Verifies user/application JWTs at the Gateway trust boundary. */
@Injectable()
export class GatewayJwtVerifierService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  /** Creates a verifier using immutable identity configuration. */
  public constructor(@Inject(GATEWAY_CONFIG) private readonly config: GatewayConfig) {
    this.jwks = createRemoteJWKSet(config.identityJwksUrl);
  }

  /** Verifies issuer, audience, signature and required subject claims. */
  public async verify(token: string): Promise<GatewayActorContext> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.config.identityIssuer,
        audience: this.config.identityAudience,
        algorithms: ["RS256", "ES256"],
      });
      return this.toActorContext(payload);
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }

  /** Converts trusted JWT claims into the internal actor context. */
  private toActorContext(payload: JWTPayload): GatewayActorContext {
    if (!payload.sub) throw new UnauthorizedException("Access token subject is missing");
    const permissions = Array.isArray(payload.permissions) ? payload.permissions.filter((x): x is string => typeof x === "string") : [];
    const scopes = Array.isArray(payload.scopes) ? payload.scopes.filter((x): x is string => typeof x === "string") : [];
    return {
      principalId: payload.sub,
      tokenId: typeof payload.sid === "string" ? payload.sid : undefined,
      tenantId: typeof payload.tenant_id === "string" ? payload.tenant_id : undefined,
      scopes,
      permissions,
    };
  }
}
