/**
 * @file jwt-verifier.ts
 * @description Cryptographic JWT verification boundary for the Registry Worker.
 *
 * Verifies incoming Bearer tokens against the Identity service's remote JWKS
 * endpoint and validates issuer and audience claims. Provides local development
 * decoding when running without deployed Terraform JWKS bindings.
 */

import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose";
import type { RegistryBindings } from "../interfaces/registry-bindings.interface";
import type { RegistryClaims } from "../interfaces/registry-claims.interface";

/**
 * Verifies a Bearer JWT from the incoming request against configured JWKS and accepted audiences.
 *
 * @param request - Incoming HTTP Request containing the Authorization header.
 * @param env - Registry worker environment bindings containing IDENTITY_JWKS_URL and IDENTITY_ISSUER.
 * @param audiences - List of acceptable audiences for this invocation.
 * @returns Verified RegistryClaims payload.
 * @throws Error if token is missing, expired, signed by an untrusted key, or lacks required claims.
 */
export async function verifyRegistryToken(
  request: Request,
  env: RegistryBindings,
  audiences: readonly string[],
): Promise<RegistryClaims> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
  if (!token) throw new Error("missing bearer token");

  // Local development fallback when running against placeholder Terraform bindings
  if (!env.IDENTITY_JWKS_URL || env.IDENTITY_JWKS_URL === "GENERATED_BY_TERRAFORM") {
    const payload = decodeJwt(token) as RegistryClaims;
    if (typeof payload.sub !== "string") throw new Error("missing sub");
    const tokenAud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const hasAudience = audiences.some((aud) => tokenAud.includes(aud));
    if (!hasAudience) throw new Error("invalid audience");
    return payload;
  }

  const jwks = createRemoteJWKSet(new URL(env.IDENTITY_JWKS_URL));
  const result = await jwtVerify(token, jwks, {
    issuer: env.IDENTITY_ISSUER,
    audience: [...audiences],
  });

  if (typeof result.payload.sub !== "string") throw new Error("missing sub");
  return result.payload as RegistryClaims;
}
