/**
 * @file auth.service.ts
 * @description Infrastructure orchestrator JWT verification boundary.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { OrchestratorBindings } from '../interfaces/orchestrator-bindings.interface';

import type { InfrastructurePrincipal } from '../interfaces/infrastructure-principal.interface';

/**
 * Verifies the caller's Identity/IAM token.
 */
export async function verifyInfrastructurePrincipal(request: Request, env: OrchestratorBindings): Promise<InfrastructurePrincipal> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
  if (!token) throw new Error('missing bearer token');
  const jwks = createRemoteJWKSet(new URL(env.IDENTITY_JWKS_URL));
  const result = await jwtVerify(token, jwks, { issuer: env.IDENTITY_ISSUER, audience: env.IDENTITY_AUDIENCE });
  if (typeof result.payload.sub !== 'string') throw new Error('missing principal');
  return result.payload as InfrastructurePrincipal;
}
