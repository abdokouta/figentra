/**
 * @file sha256.util.ts
 * @description Web Crypto hashing helper for immutable manifest fingerprints.
 */

/**
 * Computes a deterministic lowercase SHA-256 digest.
 */
export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
