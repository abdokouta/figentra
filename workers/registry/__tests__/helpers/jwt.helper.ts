/**
 * @file jwt.helper.ts
 * @description JWT signing and JWKS mocking utilities for Registry tests.
 */
import { generateKeyPair, exportJWK, SignJWT, type JWK } from "jose";

export interface TestJwtEnvironment {
  privateKey: CryptoKey | Uint8Array;
  publicKey: CryptoKey | Uint8Array;
  publicJwk: JWK;
  jwksUrl: string;
  issuer: string;
}

let cachedEnvironment: TestJwtEnvironment | null = null;

export async function getTestJwtEnvironment(): Promise<TestJwtEnvironment> {
  if (cachedEnvironment) return cachedEnvironment;

  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = "test-registry-key-1";
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";

  cachedEnvironment = {
    privateKey,
    publicKey,
    publicJwk,
    jwksUrl: "https://identity.example.test/.well-known/jwks.json",
    issuer: "https://identity.example.test/auth/v1",
  };

  return cachedEnvironment;
}

export interface CreateTokenOptions {
  sub?: string;
  principal_type?: "service" | "user";
  sid?: string;
  permissions?: string[];
  aud?: string | string[];
  exp?: string;
}

export async function createTestJwt(options: CreateTokenOptions = {}): Promise<string> {
  const env = await getTestJwtEnvironment();

  const sub = options.sub ?? "svc_registry_deployer";
  const principal_type = options.principal_type ?? "service";
  const sid = options.sid ?? (principal_type === "service" ? sub : undefined);
  const permissions = options.permissions ?? [
    "registry:read",
    "registry:application:register",
    "registry:route:resolve",
  ];
  const aud = options.aud ?? [
    "figentra:registry",
    "figentra:registry:registration",
    "figentra:registry:route-resolution",
  ];
  const exp = options.exp ?? "2h";

  const builder = new SignJWT({
    sub,
    principal_type,
    ...(sid ? { sid } : {}),
    permissions,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-registry-key-1" })
    .setIssuer(env.issuer)
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime(exp);

  return builder.sign(env.privateKey);
}

/**
 * Sets up global fetch interceptor to serve the mock JWKS endpoint.
 */
export async function setupMockJwksFetch(): Promise<void> {
  const env = await getTestJwtEnvironment();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url === env.jwksUrl) {
      return new Response(JSON.stringify({ keys: [env.publicJwk] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  }) as typeof fetch;
}
