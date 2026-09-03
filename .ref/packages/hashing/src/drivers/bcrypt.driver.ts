/**
 * @file bcrypt.driver.ts
 * @module @stackra/ts-hashing/drivers
 * @description Bcrypt hashing driver implementation.
 *   Uses the `bcryptjs` package for pure-JavaScript bcrypt hashing.
 *   Supports configurable rounds (cost factor) with a default of 12.
 */

import bcrypt from 'bcryptjs';

import type { IHasher } from '@stackra/contracts';

import { DEFAULT_BCRYPT_ROUNDS } from '../constants';
import { HashingError } from '../errors';

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Bcrypt hashing driver.
 *
 * Implements the IHasher contract using the bcryptjs library. Bcrypt is a
 * password hashing function based on the Blowfish cipher that incorporates
 * a configurable cost factor (rounds) to resist brute-force attacks.
 *
 * Hash format: `$2a${rounds}${22-char salt}{31-char hash}`
 *
 * @example
 * ```typescript
 * const hasher = new BcryptHasher({ rounds: 12 });
 * const hash = await hasher.make('my-password');
 * const valid = await hasher.check('my-password', hash);
 * ```
 */
export class BcryptHasher implements IHasher {
  /** The number of rounds (cost factor) for hashing. */
  private readonly rounds: number;

  /**
   * @param options - Bcrypt-specific configuration
   */
  public constructor(options: Record<string, unknown> = {}) {
    this.rounds = (options.rounds as number) ?? DEFAULT_BCRYPT_ROUNDS;
  }

  /**
   * Hash a plain-text value using bcrypt.
   *
   * @param value - The plain-text value to hash
   * @param options - Optional override for rounds
   * @returns The bcrypt hash string
   */
  public async make(value: string, options?: Record<string, unknown>): Promise<string> {
    const rounds = (options?.rounds as number) ?? this.rounds;

    try {
      const salt = await bcrypt.genSalt(rounds);
      return await bcrypt.hash(value, salt);
    } catch (error: Error | any) {
      throw new HashingError(`Bcrypt hashing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Verify a plain-text value against a bcrypt hash.
   *
   * @param value - The plain-text value to check
   * @param hash - The bcrypt hash to compare against
   * @returns `true` if the value matches the hash
   */
  public async check(value: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(value, hash);
    } catch (error: Error | any) {
      throw new HashingError(`Bcrypt verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Determine if the given bcrypt hash needs to be rehashed.
   *
   * Checks if the hash was created with a different cost factor than
   * the currently configured rounds.
   *
   * @param hash - The bcrypt hash to check
   * @param options - Optional override for rounds to compare against
   * @returns `true` if the hash should be recomputed
   */
  public needsRehash(hash: string, options?: Record<string, unknown>): boolean {
    const desiredRounds = (options?.rounds as number) ?? this.rounds;
    const hashRounds = bcrypt.getRounds(hash);

    return hashRounds !== desiredRounds;
  }

  /**
   * Extract information from a bcrypt hash string.
   *
   * Parses the bcrypt format `$2a$XX$...` to extract the algorithm
   * variant and cost factor.
   *
   * @param hash - The bcrypt hash to analyze
   * @returns Object containing algorithm info
   */
  public info(hash: string): Record<string, unknown> {
    const parts = hash.split('$');

    return {
      algo: 'bcrypt',
      algoVariant: parts[1] ?? '2a',
      rounds: bcrypt.getRounds(hash),
    };
  }
}
