/**
 * @file generate-metadata-key.util.ts
 * @module utils/generate-metadata-key
 * @description generateMetadataKey Utility
 */

import { DISCOVERABLE_DECORATOR_KEY_PREFIX } from "../constants";
import type { ICryptoLike } from "../interfaces/crypto-like.type";

/**
 * Generate a globally-unique metadata key for a discoverable decorator.
 *
 * Uses native `Number#toString(36)` and `String#substring()` here — both
 * are explicit exceptions in the codebase's string-handling rules
 * (radix conversion has no `Str` equivalent; `substring` is listed as an
 * approved native method for mid-string extraction).
 *
 * @returns A new prefixed metadata key string.
 *
 * @example
 * ```typescript
 * generateMetadataKey();
 * // → "@discoverable:7f1c8b40-9f2e-4a4d-b1d0-1d2c1c5e9c7e"
 * ```
 */
export function generateMetadataKey(): string {
  const cryptoRef = (globalThis as { crypto?: ICryptoLike }).crypto;
  const uuid =
    cryptoRef?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 12)}`;
  return `${DISCOVERABLE_DECORATOR_KEY_PREFIX}${uuid}`;
}
