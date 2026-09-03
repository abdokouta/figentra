import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { WorkflowRuntimeEnv } from './env.types';

/** Minimal verified service-principal claims required by workflow execution. */
export interface WorkflowClaims {
  sub: string;
  principal_type?: string;
  permissions?: string[];
}

/** Verifies a service identity for workflow execution. */
export async function verifyWorkflowToken(request: Request, env: WorkflowRuntimeEnv): Promise<WorkflowClaims> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
  if (!token) throw new Error('missing bearer token');

  const jwks = createRemoteJWKSet(new URL(env.IDENTITY_JWKS_URL));
  const result = await jwtVerify(token, jwks, {
    issuer: env.IDENTITY_ISSUER,
    audience: env.IDENTITY_AUDIENCE,
  });

  if (typeof result.payload.sub !== 'string') throw new Error('missing sub');
  return result.payload as WorkflowClaims;
}
