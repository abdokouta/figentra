/**
 * @file hash-analyzer.util.ts
 * @module @stackra/ts-hashing/utils
 * @description Hash analysis utility that detects the algorithm from a hash string.
 *   Supports bcrypt, argon2 (argon2i, argon2id, argon2d), and scrypt formats.
 */

import type { IHashInfo } from '../types';
import { HashAlgorithm } from '../enums';

// ════════════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Analyze a hash string to detect the algorithm and extract parameters.
 *
 * Recognizes the following hash formats:
 * - `$2b$` / `$2a$` / `$2y$` → bcrypt (extracts rounds)
 * - `$argon2id$` / `$argon2i$` / `$argon2d$` → argon2 (extracts m, t, p)
 * - `$scrypt$` → scrypt (extracts N, r, p)
 *
 * @param hashedValue - The hash string to analyze
 * @returns Structured information about the hash
 *
 * @example
 * ```typescript
 * const info = analyzeHash('$2b$12$...');
 * // => { algorithm: 'bcrypt', valid: true, options: { rounds: 12 } }
 *
 * const info2 = analyzeHash('$argon2id$v=19$m=65536,t=3,p=4$...$...');
 * // => { algorithm: 'argon2id', valid: true, options: { memoryCost: 65536, timeCost: 3, parallelism: 4 } }
 * ```
 */
export function analyzeHash(hashedValue: string): IHashInfo {
  if (!hashedValue || typeof hashedValue !== 'string') {
    return { algorithm: null, valid: false, options: {} };
  }

  // Bcrypt: $2a$, $2b$, $2y$
  if (/^\$2[aby]\$\d{2}\$/.test(hashedValue)) {
    return analyzeBcrypt(hashedValue);
  }

  // Argon2: $argon2id$, $argon2i$, $argon2d$
  if (/^\$argon2(id|i|d)\$/.test(hashedValue)) {
    return analyzeArgon2(hashedValue);
  }

  // Scrypt: $scrypt$
  if (hashedValue.startsWith('$scrypt$')) {
    return analyzeScrypt(hashedValue);
  }

  return { algorithm: null, valid: false, options: {} };
}

/**
 * Analyze a bcrypt hash string.
 *
 * @param hash - The bcrypt hash to analyze
 * @returns Hash info with algorithm and rounds
 */
function analyzeBcrypt(hash: string): IHashInfo {
  const parts = hash.split('$');
  // Format: $2b$12$salthash
  if (parts.length < 4) {
    return { algorithm: HashAlgorithm.BCRYPT, valid: false, options: {} };
  }

  const variant = parts[1]!;
  const rounds = parseInt(parts[2]!, 10);

  return {
    algorithm: HashAlgorithm.BCRYPT,
    valid: !isNaN(rounds) && hash.length >= 59,
    options: { variant, rounds },
  };
}

/**
 * Analyze an argon2 hash string.
 *
 * @param hash - The argon2 hash to analyze
 * @returns Hash info with algorithm and parameters
 */
function analyzeArgon2(hash: string): IHashInfo {
  const parts = hash.split('$');
  // Format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
  if (parts.length < 4) {
    return { algorithm: HashAlgorithm.ARGON2ID, valid: false, options: {} };
  }

  const algo = parts[1] as string;
  const options: Record<string, unknown> = {};

  // Extract version
  const versionPart = parts[2] ?? '';
  if (versionPart.startsWith('v=')) {
    options.version = parseInt(versionPart.replace('v=', ''), 10);
  }

  // Extract parameters
  const paramPart = parts[3] ?? '';
  const paramPairs = paramPart.split(',');
  for (const pair of paramPairs) {
    const [key, val] = pair.split('=');
    if (key === 'm') options.memoryCost = parseInt(val!, 10);
    if (key === 't') options.timeCost = parseInt(val!, 10);
    if (key === 'p') options.parallelism = parseInt(val!, 10);
  }

  const algorithm = algo === 'argon2id' ? HashAlgorithm.ARGON2ID : HashAlgorithm.ARGON2;

  return {
    algorithm,
    valid: parts.length >= 6,
    options,
  };
}

/**
 * Analyze a scrypt hash string.
 *
 * @param hash - The scrypt hash to analyze
 * @returns Hash info with algorithm and parameters
 */
function analyzeScrypt(hash: string): IHashInfo {
  const parts = hash.split('$');
  // Format: $scrypt$N=16384,r=8,p=1$salt$hash
  if (parts.length < 5) {
    return { algorithm: HashAlgorithm.SCRYPT, valid: false, options: {} };
  }

  const options: Record<string, unknown> = {};
  const paramPart = parts[2] ?? '';
  const paramPairs = paramPart.split(',');

  for (const pair of paramPairs) {
    const [key, val] = pair.split('=');
    if (key === 'N') options.cost = parseInt(val!, 10);
    if (key === 'r') options.blockSize = parseInt(val!, 10);
    if (key === 'p') options.parallelization = parseInt(val!, 10);
  }

  return {
    algorithm: HashAlgorithm.SCRYPT,
    valid: parts.length === 5,
    options,
  };
}
