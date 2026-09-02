/** @file gateway.config.ts @description Validated Gateway runtime configuration. */
import { z } from "zod";
import { UPSTREAM_MAX_RETRIES, UPSTREAM_TIMEOUT_MS } from "../constants/gateway.constant";

/** Runtime environment schema. */
const GatewayEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.string().default("info"),
  IDENTITY_JWKS_URL: z.string().url(),
  IDENTITY_ISSUER: z.string().url(),
  IDENTITY_AUDIENCE: z.string().min(1),
  IDENTITY_SERVICE_URL: z.string().url(),
  IAM_SERVICE_URL: z.string().url(),
  REGISTRY_SERVICE_URL: z.string().url(),
  GATEWAY_SERVICE_TOKEN: z.string().min(20),
  REDIS_URL: z.string().url().optional(),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().min(100).max(60000).default(UPSTREAM_TIMEOUT_MS),
  UPSTREAM_MAX_RETRIES: z.coerce.number().int().min(0).max(2).default(UPSTREAM_MAX_RETRIES),
  CORS_ORIGINS: z.string().default("")
});

/** Validated Gateway runtime configuration. */
export interface GatewayConfig {
  /** Environment name. */
  readonly environment: "development" | "staging" | "production";
  /** HTTP port. */
  readonly port: number;
  /** Log level. */
  readonly logLevel: string;
  /** Identity JWKS endpoint. */
  readonly identityJwksUrl: URL;
  /** Expected JWT issuer. */
  readonly identityIssuer: string;
  /** Expected JWT audience. */
  readonly identityAudience: string;
  /** Identity service origin. */
  readonly identityServiceUrl: string;
  /** IAM service origin. */
  readonly iamServiceUrl: string;
  /** Registry service origin. */
  readonly registryServiceUrl: string;
  /** Gateway's service credential for upstream exchange. */
  readonly gatewayServiceToken: string;
  /** Optional Redis origin. */
  readonly redisUrl?: string;
  /** Upstream timeout. */
  readonly upstreamTimeoutMs: number;
  /** Safe retry count. */
  readonly upstreamMaxRetries: number;
  /** CORS allow-list. */
  readonly corsOrigins: readonly string[];
}

/** Validates and normalizes process environment. */
export function loadGatewayConfig(environment: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const parsed = GatewayEnvironmentSchema.safeParse(environment);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid Gateway configuration: ${details}`);
  }
  return {
    environment: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    logLevel: parsed.data.LOG_LEVEL,
    identityJwksUrl: new URL(parsed.data.IDENTITY_JWKS_URL),
    identityIssuer: parsed.data.IDENTITY_ISSUER,
    identityAudience: parsed.data.IDENTITY_AUDIENCE,
    identityServiceUrl: parsed.data.IDENTITY_SERVICE_URL,
    iamServiceUrl: parsed.data.IAM_SERVICE_URL,
    registryServiceUrl: parsed.data.REGISTRY_SERVICE_URL,
    gatewayServiceToken: parsed.data.GATEWAY_SERVICE_TOKEN,
    redisUrl: parsed.data.REDIS_URL,
    upstreamTimeoutMs: parsed.data.UPSTREAM_TIMEOUT_MS,
    upstreamMaxRetries: parsed.data.UPSTREAM_MAX_RETRIES,
    corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean),
  };
}
