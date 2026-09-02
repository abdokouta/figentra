/**
 * @file iam-client.ts
 * @description Concrete IAM authorization adapter using the transport-neutral
 * Figentra RPC port.
 */
import type { AuthorizationContext } from "@stackra/contracts";
import type { RpcClient } from "@figentra/messaging";
import type { AuthorizationDecisionPort } from "./index.js";

/**
 * IAM authorization request contract.
 */
export interface IamAuthorizationRequest {
  /** Authenticated principal context. */
  readonly context: AuthorizationContext;
  /** Permission to evaluate. */
  readonly permission: string;
}

/**
 * IAM authorization response contract.
 */
export interface IamAuthorizationResponse {
  /** Authoritative allow/deny result. */
  readonly allowed: boolean;
  /** Optional decision identifier for audit correlation. */
  readonly decisionId?: string;
}

/**
 * Calls IAM through the internal RPC abstraction.
 */
export class IamRpcAuthorizationAdapter implements AuthorizationDecisionPort {
  /**
   * @param rpc - Transport-neutral RPC client.
   * @param subject - Versioned IAM authorization subject.
   */
  public constructor(
    private readonly rpc: RpcClient,
    private readonly subject = "iam.authorization.check.v1",
  ) {}

  /**
   * Requests an authoritative IAM decision.
   *
   * @param context - Authenticated principal/tenant/scope context.
   * @param permission - Canonical permission name.
   * @returns True only when IAM explicitly allows the operation.
   */
  public async authorize(context: AuthorizationContext, permission: string): Promise<boolean> {
    const envelope = {
      id: crypto.randomUUID(),
      type: "figentra.iam.authorization.check",
      version: "1",
      timestamp: new Date().toISOString(),
      producer: context.serviceId,
      audience: "figentra:iam",
      correlationId: context.tokenId ?? crypto.randomUUID(),
      principalId: context.principalId,
      tenantId: context.tenantId,
      payload: { context, permission } satisfies IamAuthorizationRequest,
    };

    const result = await this.rpc.send<IamAuthorizationResponse, IamAuthorizationRequest>(
      this.subject,
      envelope,
    );

    return result.allowed === true;
  }
}
