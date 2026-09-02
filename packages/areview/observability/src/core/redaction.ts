/**
 * @file redaction.ts
 * @description Security redaction policy for structured telemetry.
 */

/** Fields that must never be emitted into logs or telemetry attributes. */
export const SENSITIVE_LOG_FIELDS = Object.freeze([
  "authorization",
  "cookie",
  "password",
  "secret",
  "client_secret",
  "access_token",
  "refresh_token",
  "api_key",
  "private_key",
  "otp",
  "saml_assertion",
  "session",
  "jwt",
] as const);
