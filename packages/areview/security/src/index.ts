/**
 * @file index.ts
 * @description Authentication and authorization primitives shared by Figentra
 * services.
 *
 * Transport authentication and IAM authorization are deliberately separate:
 * NATS credentials/TLS authenticate the connection, JWT authenticates the
 * service/application principal, and IAM decides whether that principal may
 * perform a requested operation.
 */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Inject,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { AuthorizationContext } from "@stackra/contracts";

/**
 * Configuration for service JWT verification.
 */
export interface ServiceIdentityVerifierOptions {
  /** Public JWKS URL published by Figentra Identity/Supabase. */
  readonly jwksUrl: URL;
  /** Expected token issuer. */
  readonly issuer: string;
  /** Expected service audience. */
  readonly audience: string;
}

/**
 * Verified service identity claims.
 */
export interface ServiceIdentityClaims extends JWTPayload {
  /** Stable principal identifier. */
  readonly sub: string;
  /** Service session/client identifier. */
  readonly sid: string;
  /** Optional tenant context. */
  readonly tenant_id?: string;
  /** Optional dynamic scope context. */
  readonly scope?: Record<string, string>;
  /** Optional service scopes. */
  readonly scopes?: string[];
  /** Principal type. */
  readonly principal_type?: string;
}

/**
 * Verifies service identity tokens against the configured issuer and JWKS.
 */
@Injectable()
export class ServiceIdentityVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  /**
   * @param options - Issuer, audience, and JWKS verification configuration.
   */
  public constructor(private readonly options: ServiceIdentityVerifierOptions) {
    this.jwks = createRemoteJWKSet(options.jwksUrl);
  }

  /**
   * Verifies signature, issuer, audience, and mandatory service claims.
   *
   * @param token - Bearer token without the scheme prefix.
   * @returns Trusted service identity claims.
   */
  public async verify(token: string): Promise<ServiceIdentityClaims> {
    const result = await jwtVerify(token, this.jwks, {
      issuer: this.options.issuer,
      audience: this.options.audience,
    });

    if (!result.payload.sub || !result.payload.sid) {
      throw new UnauthorizedException("Service identity token is incomplete");
    }

    return result.payload as ServiceIdentityClaims;
  }
}

/**
 * Builds the normalized authorization context consumed by IAM.
 *
 * @param claims - Verified service identity claims.
 * @param serviceId - Local service identifier.
 * @returns Canonical internal authorization context.
 */
export function toAuthorizationContext(
  claims: ServiceIdentityClaims,
  serviceId: string,
): AuthorizationContext {
  return {
    principalId: claims.sub,
    serviceId,
    tenantId: claims.tenant_id,
    scopes: Object.entries(claims.scope ?? {}).map(([type, id]) => `${type}:${id}`),
    permissions: claims.scopes ?? [],
    tokenId: claims.sid,
  };
}

/**
 * Metadata key used by the IAM authorization guard.
 */
export const REQUIRED_PERMISSION = Symbol("figentra.required-permission");

/**
 * Declares the IAM permission required by a handler.
 *
 * @param permission - Canonical Figentra permission name.
 */
export const RequirePermission = (permission: string): MethodDecorator =>
  SetMetadata(REQUIRED_PERMISSION, permission);

/**
 * Minimal authorization decision port.
 *
 * @remarks The concrete adapter calls IAM through the internal RPC contract.
 */
export interface AuthorizationDecisionPort {
  /** Requests an IAM decision for the current context. */
  authorize(context: AuthorizationContext, permission: string): Promise<boolean>;
}

/**
 * Enforces IAM permission decisions at a NestJS handler boundary.
 */
@Injectable()
export class IamAuthorizationGuard implements CanActivate {
  /**
   * @param reflector - Nest metadata reflector.
   * @param authorizer - IAM RPC adapter.
   */
  public constructor(
    private readonly reflector: {
      get<T>(metadataKey: symbol, target: object): T | undefined;
    },
    private readonly authorizer: AuthorizationDecisionPort,
  ) { }

  /**
   * Resolves the required permission and asks IAM for the authoritative result.
   *
   * @param context - Current Nest execution context.
   * @returns Whether the request is authorized.
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<string>(REQUIRED_PERMISSION, context.getHandler());
    if (!permission) return true;

    const request = context.switchToHttp().getRequest<{ authorizationContext?: AuthorizationContext }>();
    const auth = request.authorizationContext;
    if (!auth) throw new UnauthorizedException("Missing authorization context");

    if (!(await this.authorizer.authorize(auth, permission))) {
      throw new ForbiddenException("Permission denied");
    }

    return true;
  }
}

/**
 * Metadata token identifying the local Figentra service.
 */
export const FIGENTRA_SERVICE_ID = Symbol("figentra.service-id");

/**
 * HTTP bearer-token guard for service-to-service requests.
 */
export class ServiceIdentityGuard implements CanActivate {
  /**
   * @param verifier - Identity JWT verifier.
   * @param serviceId - Local service identifier inserted into the auth context.
   */
  public constructor(
    private readonly verifier: ServiceIdentityVerifier,
    @Inject(FIGENTRA_SERVICE_ID) private readonly serviceId: string,
  ) { }

  /**
   * Authenticates the bearer token and attaches the authorization context.
   *
   * @param context - Nest HTTP execution context.
   * @returns True after authentication succeeds.
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      authorizationContext?: AuthorizationContext;
    }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const claims = await this.verifier.verify(authorization.slice(7));
    request.authorizationContext = toAuthorizationContext(claims, this.serviceId);
    return true;
  }
}

/**
 * Re-exports the IAM RPC adapter used by service integrations.
 */
/**
 * Re-exports the IAM RPC adapter used by service integrations.
 */
export { IamRpcAuthorizationAdapter } from "./iam-client";

/**
 * Re-exports the IAM authorization request and response contracts.
 */
export type { IamAuthorizationRequest, IamAuthorizationResponse } from "./iam-client";
