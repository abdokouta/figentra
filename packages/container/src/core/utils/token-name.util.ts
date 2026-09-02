/**
 * @file token-name.util.ts
 * @module utils/token-name
 * @description tokenName Utility
 */

/**
 * Get a human-readable string for any injection token.
 *
 * - Functions (classes) → `function.name`
 * - Symbols → `Symbol#toString()` (`"Symbol(MY_TOKEN)"`)
 * - Everything else → `String(token)` (type coercion)
 *
 * @param token - The token to describe.
 * @returns A readable name suitable for logs and error messages.
 *
 * @example
 * ```typescript
 * tokenName(UserService); // → "UserService"
 * tokenName(Symbol.for("MY_TOKEN")); // → "Symbol(MY_TOKEN)"
 * tokenName("API_URL"); // → "API_URL"
 * ```
 */
export function tokenName(token: unknown): string {
  if (typeof token === "function") return token.name;
  if (typeof token === "symbol") return token.toString();
  return String(token);
}
