/**
 * @file scrypt.driver.ts
 * @module @stackra/ts-hashing/drivers
 * @description Scrypt hashing driver implementation.
 *   Uses Node.js built-in `crypto.scrypt` and `crypto.timingSafeEqual`.
 *   Stores hashes in a self-describing format with embedded parameters.
 */

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import type { IHasher } from '@stackra/contracts';

import {
  DEFAULT_SCRYPT_COST,
  DEFAULT_SCRYPT_BLOCK_SIZE,
  DEFAULT_SCRYPT_PARALLELIZATION,
  DEFAULT_SCRYPT_KEY_LENGTH,
} from '../constants';
import { HashingError } from '../errors';

// ════════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════════

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: Record<string, unknown>
) => Promise<Buffer>;

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Scrypt hashing driver.
 *
 * Implements the IHasher contract using Node.js native `crypto.scrypt`.
 * Scrypt is designed to be memory-hard, making it resistant to
 * hardware brute-force attacks (ASICs, GPUs).
 *
 * Hash format: `$scrypt$N={cost},r={blockSize},p={parallelization}${salt}${hash}`
 * where salt and hash are base64-encoded.
 *
 * @example
 * ```typescript
 * const hasher = new ScryptHasher({ cost: 16384, blockSize: 8, parallelization: 1, keyLength: 64 });
 * const hash = await hasher.make('my-password');
 * const valid = await hasher.check('my-password', hash);
 * ```
 */
export class ScryptHasher implements IHasher {
  /** CPU/memory cost parameter (N). Must be a power of 2. */
  private readonly cost: number;

  /** Block size parameter (r). */
  private readonly blockSize: number;

  /** Parallelization parameter (p). */
  private readonly parallelization: number;

  /** Derived key length in bytes. */
  private readonly keyLength: number;

  /**
   * @param options - Scrypt-specific configuration
   */
  public constructor(options: Record<string, unknown> = {}) {
    this.cost = (options.cost as number) ?? DEFAULT_SCRYPT_COST;
    this.blockSize = (options.blockSize as number) ?? DEFAULT_SCRYPT_BLOCK_SIZE;
    this.parallelization = (options.parallelization as number) ?? DEFAULT_SCRYPT_PARALLELIZATION;
    this.keyLength = (options.keyLength as number) ?? DEFAULT_SCRYPT_KEY_LENGTH;
  }

  /**
   * Hash a plain-text value using scrypt.
   *
   * Generates a random 32-byte salt, derives the key, and encodes the result
   * in the self-describing format: `$scrypt$N={cost},r={blockSize},p={parallelization}${salt}${hash}`
   *
   * @param value - The plain-text value to hash
   * @param options - Optional override for scrypt parameters
   * @returns The scrypt hash string in self-describing format
   */
  public async make(value: string, options?: Record<string, unknown>): Promise<string> {
    const cost = (options?.cost as number) ?? this.cost;
    const blockSize = (options?.blockSize as number) ?? this.blockSize;
    const parallelization = (options?.parallelization as number) ?? this.parallelization;
    const keyLength = (options?.keyLength as number) ?? this.keyLength;

    const salt = randomBytes(32);

    try {
      const derivedKey = (await scryptAsync(value, salt, keyLength, {
        N: cost,
        r: blockSize,
        p: parallelization,
      })) as Buffer;

      const saltBase64 = salt.toString('base64');
      const hashBase64 = derivedKey.toString('base64');

      return `$scrypt$N=${cost},r=${blockSize},p=${parallelization}$${saltBase64}$${hashBase64}`;
    } catch (error: Error | any) {
      throw new HashingError(`Scrypt hashing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Verify a plain-text value against a scrypt hash.
   *
   * Parses the stored hash to extract parameters and salt, re-derives the key
   * with the same parameters, and uses timing-safe comparison.
   *
   * @param value - The plain-text value to check
   * @param hash - The scrypt hash string to compare against
   * @returns `true` if the value matches the hash
   */
  public async check(value: string, hash: string): Promise<boolean> {
    const parsed = this.parseHash(hash);
    if (!parsed) {
      return false;
    }

    try {
      const derivedKey = (await scryptAsync(value, parsed.salt, parsed.keyLength, {
        N: parsed.cost,
        r: parsed.blockSize,
        p: parsed.parallelization,
      })) as Buffer;

      return timingSafeEqual(derivedKey, parsed.hash);
    } catch {
      return false;
    }
  }

  /**
   * Determine if the given scrypt hash needs to be rehashed.
   *
   * Compares the stored parameters against the currently configured options.
   *
   * @param hash - The scrypt hash to check
   * @param options - Optional override for parameters to compare against
   * @returns `true` if the hash should be recomputed
   */
  public needsRehash(hash: string, options?: Record<string, unknown>): boolean {
    const desiredCost = (options?.cost as number) ?? this.cost;
    const desiredBlockSize = (options?.blockSize as number) ?? this.blockSize;
    const desiredParallelization = (options?.parallelization as number) ?? this.parallelization;
    const desiredKeyLength = (options?.keyLength as number) ?? this.keyLength;

    const parsed = this.parseHash(hash);
    if (!parsed) {
      return true;
    }

    return (
      parsed.cost !== desiredCost ||
      parsed.blockSize !== desiredBlockSize ||
      parsed.parallelization !== desiredParallelization ||
      parsed.keyLength !== desiredKeyLength
    );
  }

  /**
   * Extract information from a scrypt hash string.
   *
   * Parses the self-describing format to return structured parameter info.
   *
   * @param hash - The scrypt hash to analyze
   * @returns Object containing algorithm info and parameters
   */
  public info(hash: string): Record<string, unknown> {
    const parsed = this.parseHash(hash);
    if (!parsed) {
      return { algo: 'scrypt', valid: false };
    }

    return {
      algo: 'scrypt',
      cost: parsed.cost,
      blockSize: parsed.blockSize,
      parallelization: parsed.parallelization,
      keyLength: parsed.keyLength,
    };
  }

  /**
   * Parse a scrypt hash string into its components.
   *
   * Expected format: `$scrypt$N={cost},r={blockSize},p={parallelization}${salt}${hash}`
   *
   * @param hash - The hash string to parse
   * @returns Parsed components or null if the format is invalid
   */
  private parseHash(hash: string): {
    cost: number;
    blockSize: number;
    parallelization: number;
    salt: Buffer;
    hash: Buffer;
    keyLength: number;
  } | null {
    const parts = hash.split('$');
    // Expected: ['', 'scrypt', 'N=...,r=...,p=...', salt, hash]
    if (parts.length !== 5 || parts[1] !== 'scrypt') {
      return null;
    }

    const params = parts[2]!;
    const saltBase64 = parts[3]!;
    const hashBase64 = parts[4]!;

    let cost = this.cost;
    let blockSize = this.blockSize;
    let parallelization = this.parallelization;

    const paramParts = params.split(',');
    for (const param of paramParts) {
      const [key, val] = param.split('=');
      if (key === 'N') cost = parseInt(val!, 10);
      if (key === 'r') blockSize = parseInt(val!, 10);
      if (key === 'p') parallelization = parseInt(val!, 10);
    }

    const salt = Buffer.from(saltBase64, 'base64');
    const hashBuffer = Buffer.from(hashBase64, 'base64');

    return {
      cost,
      blockSize,
      parallelization,
      salt,
      hash: hashBuffer,
      keyLength: hashBuffer.length,
    };
  }
}
