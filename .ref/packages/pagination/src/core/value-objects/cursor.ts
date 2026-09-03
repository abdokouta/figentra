/**
 * @file cursor.ts
 * @module @stackra/ts-pagination/core/value-objects
 * @description Cursor value object for keyset pagination.
 *   Encapsulates cursor parameters with URL-safe base64 encoding/decoding.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Cursor Value Object
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Immutable cursor value object for keyset pagination.
 *
 * Encodes a set of key-value parameters into a URL-safe base64 string
 * and provides directionality (points to next or previous items).
 *
 * The encoding uses URL-safe base64 (replacing +/= with -_) to ensure
 * the cursor can be safely used as a query parameter without additional escaping.
 *
 * @example
 * ```typescript
 * const cursor = new Cursor({ id: '42', created_at: '2024-01-01' }, true);
 * const encoded = cursor.encode(); // URL-safe base64 string
 * const decoded = Cursor.fromEncoded(encoded);
 * ```
 */
export class Cursor {
  /**
   * @param parameters - Key-value map of cursor column values
   * @param pointsToNext - Whether this cursor points to the next set of items
   */
  public constructor(
    private readonly _parameters: Record<string, string>,
    private readonly _pointsToNext: boolean = true
  ) {}

  /**
   * Retrieve a single parameter value by name.
   *
   * @param name - Parameter name to look up
   * @returns The parameter value, or null if not found
   */
  public parameter(name: string): string | null {
    return this._parameters[name] ?? null;
  }

  /**
   * Retrieve multiple parameter values by name.
   *
   * @param names - Array of parameter names to look up
   * @returns Record of found parameter name-value pairs
   */
  public parameters(names: string[]): Record<string, string> {
    const result: Record<string, string> = {};

    for (const name of names) {
      if (name in this._parameters) {
        result[name] = this._parameters[name]!;
      }
    }

    return result;
  }

  /**
   * Whether this cursor points to the next set of items.
   *
   * @returns True if navigating forward
   */
  public pointsToNextItems(): boolean {
    return this._pointsToNext;
  }

  /**
   * Whether this cursor points to the previous set of items.
   *
   * @returns True if navigating backward
   */
  public pointsToPreviousItems(): boolean {
    return !this._pointsToNext;
  }

  /**
   * Encode the cursor into a URL-safe base64 string.
   *
   * The payload is a JSON object with `_pointsToNext` merged with the parameters.
   * The result uses URL-safe base64 encoding (+ → -, / → _, padding removed).
   *
   * @returns URL-safe base64-encoded cursor string
   */
  public encode(): string {
    const payload = JSON.stringify({
      ...this._parameters,
      _pointsToNext: this._pointsToNext,
    });

    const base64 = Buffer.from(payload, 'utf-8').toString('base64');

    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Decode a URL-safe base64-encoded cursor string into a Cursor instance.
   *
   * Returns null if the input is null, empty, or cannot be decoded.
   *
   * @param encoded - URL-safe base64-encoded cursor string, or null
   * @returns Decoded Cursor instance, or null if input is invalid
   */
  public static fromEncoded(encoded: string | null): Cursor | null {
    if (!encoded) {
      return null;
    }

    try {
      let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');

      const pad = base64.length % 4;
      if (pad) {
        base64 += '='.repeat(4 - pad);
      }

      const json = Buffer.from(base64, 'base64').toString('utf-8');
      const parsed = JSON.parse(json) as Record<string, unknown>;

      const pointsToNext = parsed._pointsToNext !== false;
      const parameters: Record<string, string> = {};

      for (const [key, value] of Object.entries(parsed)) {
        if (key !== '_pointsToNext') {
          parameters[key] = String(value);
        }
      }

      return new Cursor(parameters, pointsToNext);
    } catch {
      return null;
    }
  }

  /**
   * Serialize the cursor to a plain object for JSON responses.
   *
   * @returns Record containing all parameters and the direction flag
   */
  public toArray(): Record<string, unknown> {
    return {
      ...this._parameters,
      _pointsToNext: this._pointsToNext,
    };
  }
}
