/**
 * @file jwt-verifier.ts
 * @description Registry JWT verification boundary.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { RegistryBindings } from '../interfaces/registry-bindings.interface.js';
import type { RegistryClaims } from '../interfaces/registry-claims.interface.js';

/**
 * Verifies a bearer token against the configured Identity JWKS and accepted audiences.
 */
export async function verifyRegistryToken(request: Request, env: RegistryBindings, audiences: readonly string[]): Promise<RegistryClaims> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
  if (!token) throw new Error('missing bearer token');
  const jwks = createRemoteJWKSet(new URL(env.IDENTITY_JWKS_URL));
  const result = await jwtVerify(token, jwks, { issuer: env.IDENTITY_ISSUER, audience: audiences });
  if (typeof result.payload.sub !== 'string') throw new Error('missing sub');
  return result.payload as RegistryClaims;
}
