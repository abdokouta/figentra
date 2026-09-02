/** @file request-context.type.ts @description Trusted request context types. */

/** Authenticated actor context established after JWT verification. */
export interface GatewayActorContext {
  /** Principal subject. */
  readonly principalId: string;
  /** Token/session identifier. */
  readonly tokenId?: string;
  /** Tenant selected by the authenticated principal. */
  readonly tenantId?: string;
  /** Authorized scope identifiers. */
  readonly scopes: readonly string[];
  /** Granted permissions supplied by the trusted authorization source. */
  readonly permissions: readonly string[];
}

/** Distributed request metadata. */
export interface GatewayRequestContext {
  /** Request identifier. */
  readonly requestId: string;
  /** End-to-end correlation identifier. */
  readonly correlationId: string;
  /** W3C traceparent value when supplied. */
  readonly traceparent?: string;
  /** Authenticated actor, when the route requires authentication. */
  readonly actor?: GatewayActorContext;
}
