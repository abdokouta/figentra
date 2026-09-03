/**
 * @file argon2.driver.ts
 * @module @stackra/ts-hashing/drivers
 * @description Argon2 hashing driver implementation.
 *   Uses dynamic `import('argon2')` to support optional peer dependency.
 *   Provides argon2id hashing with configurable memory, time, and parallelism.
 */

import type { IHasher } from '@stackra/contracts';

import { HashingError } from '../errors';

// ════════════════════════════════════════════════════════════════════════════════
// Driver
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Argon2 hashing driver.
 *
 * Implements the IHasher contract using the argon2 library (optional peer dep).
 * Argon2 is the winner of the Password Hashing Competition (2015) and provides
 * resistance to GPU cracking attacks via configurable memory usage.
 *
 * Uses argon2id variant by default (hybrid of argon2i and argon2d).
 *
 * @example
 * ```typescript
 * const hasher = new Argon2Hasher({ memoryCost: 65536, timeCost: 3, parallelism: 4 });
 * const hash = await hasher.make('my-password');
 * const valid = await hasher.check('my-password', hash);
 * ```
 */
export class Argon2Hasher implements IHasher {
  /** Memory cost in KiB. */
  private readonly memoryCost: number;

  /** Number of iterations (time cost). */
  private readonly timeCost: number;

  /** Degree of parallelism. */
  private readonly parallelism: number;

  /**
   * @param options - Argon2-specific configuration
   */
  public constructor(options: Record<string, unknown> = {}) {
    this.memoryCost = (options.memoryCost as number) ?? 65536;
    this.timeCost = (options.timeCost as number) ?? 3;
    this.parallelism = (options.parallelism as number) ?? 4;
  }

  /**
   * Hash a plain-text value using argon2id.
   *
   * @param value - The plain-text value to hash
   * @param options - Optional override for argon2 parameters
   * @returns The argon2 hash string
   * @throws {HashingError} When argon2 is not installed or hashing fails
   */
  public async make(value: string, options?: Record<string, unknown>): Promise<string> {
    const argon2 = await this.loadArgon2();

    const memoryCost = (options?.memoryCost as number) ?? this.memoryCost;
    const timeCost = (options?.timeCost as number) ?? this.timeCost;
    const parallelism = (options?.parallelism as number) ?? this.parallelism;

    try {
      return await argon2.hash(value, {
        memoryCost,
        timeCost,
        parallelism,
        type: argon2.argon2id,
      });
    } catch (error: Error | any) {
      throw new HashingError(`Argon2 hashing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Verify a plain-text value against an argon2 hash.
   *
   * @param value - The plain-text value to check
   * @param hash - The argon2 hash to compare against
   * @returns `true` if the value matches the hash
   * @throws {HashingError} When argon2 is not installed or verification fails
   */
  public async check(value: string, hash: string): Promise<boolean> {
    const argon2 = await this.loadArgon2();

    try {
      return await argon2.verify(hash, value);
    } catch (error: Error | any) {
      throw new HashingError(`Argon2 verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Determine if the given argon2 hash needs to be rehashed.
   *
   * Delegates to argon2's built-in needsRehash function which compares
   * the encoded parameters against the desired options.
   *
   * @param hash - The argon2 hash to check
   * @param options - Optional override for parameters to compare against
   * @returns `true` if the hash should be recomputed
   */
  public needsRehash(hash: string, options?: Record<string, unknown>): boolean {
    const memoryCost = (options?.memoryCost as number) ?? this.memoryCost;
    const timeCost = (options?.timeCost as number) ?? this.timeCost;
    const parallelism = (options?.parallelism as number) ?? this.parallelism;

    // Parse the hash to compare parameters
    const info = this.info(hash);

    return (
      info.memoryCost !== memoryCost ||
      info.timeCost !== timeCost ||
      info.parallelism !== parallelism
    );
  }

  /**
   * Extract information from an argon2 hash string.
   *
   * Parses the argon2 encoded format:
   * `$argon2id$v=19$m=65536,t=3,p=4$salt$hash`
   *
   * @param hash - The argon2 hash to analyze
   * @returns Object containing algorithm info and parameters
   */
  public info(hash: string): Record<string, unknown> {
    const parts = hash.split('$');
    // Format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
    const algo = parts[1] ?? 'argon2id';
    const version = parts[2]?.replace('v=', '') ?? '19';
    const params = parts[3] ?? '';

    let memoryCost = this.memoryCost;
    let timeCost = this.timeCost;
    let parallelism = this.parallelism;

    const paramParts = params.split(',');
    for (const param of paramParts) {
      const [key, val] = param.split('=');
      if (key === 'm') memoryCost = parseInt(val!, 10);
      if (key === 't') timeCost = parseInt(val!, 10);
      if (key === 'p') parallelism = parseInt(val!, 10);
    }

    return {
      algo,
      version: parseInt(version, 10),
      memoryCost,
      timeCost,
      parallelism,
    };
  }

  /**
   * Dynamically import the argon2 library.
   *
   * @returns The argon2 module
   * @throws {HashingError} When argon2 is not installed
   */
  private async loadArgon2(): Promise<any> {
    try {
      return await import('argon2');
    } catch {
      throw new HashingError(
        'The "argon2" package is required to use the Argon2 driver. ' +
          'Install it with: npm install argon2'
      );
    }
  }
}
