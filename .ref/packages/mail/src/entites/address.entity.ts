/**
 * Address Class
 *
 * Represents an email address with optional name.
 * Used for to, cc, bcc, replyTo, and from addresses.
 *
 * @example
 * ```typescript
 * // Create from string
 * const addr = Address.make('user@example.com');
 *
 * // Create with name
 * const addr = Address.make('user@example.com', 'John Doe');
 *
 * // Create from object
 * const addr = Address.from({ email: 'user@example.com', name: 'John Doe' });
 * ```
 */
export class Address {
  /**
   * The email address
   */
  public readonly email: string;

  /**
   * The recipient's name (optional)
   */
  public readonly name?: string;

  /**
   * Create a new Address instance
   *
   * @param email - The email address
   * @param name - The recipient's name (optional)
   */
  constructor(email: string, name?: string) {
    this.name = name;
    this.email = email;
  }

  /**
   * Create Address from various input formats
   *
   * @param input - Email string, Address object, or plain object with email/name
   * @returns Address instance
   *
   * @example
   * ```typescript
   * Address.from('user@example.com');
   * Address.from({ email: 'user@example.com', name: 'John' });
   * Address.from(existingAddress);
   * ```
   */
  public static from(input: string | Address | { email: string; name?: string }): Address {
    if (typeof input === 'string') {
      return Address.make(input);
    }

    if (input instanceof Address) {
      return input;
    }

    return Address.make(input.email, input.name);
  }

  /**
   * Convert multiple inputs to Address array
   *
   * @param inputs - Single or array of addresses
   * @returns Array of Address instances
   *
   * @example
   * ```typescript
   * Address.fromMany('user@example.com');
   * Address.fromMany(['user1@example.com', 'user2@example.com']);
   * Address.fromMany([{ email: 'user@example.com', name: 'John' }]);
   * ```
   */
  public static fromMany(
    inputs:
      | string
      | Address
      | { email: string; name?: string }
      | Array<string | Address | { email: string; name?: string }>,
  ): Address[] {
    const inputArray = Array.isArray(inputs) ? inputs : [inputs];
    return inputArray.map((input) => Address.from(input));
  }

  /**
   * Convert Address to plain object
   *
   * @returns Plain object with email and name
   */
  public toObject(): { email: string; name?: string } {
    return {
      email: this.email,
      ...(this.name && { name: this.name }),
    };
  }

  /**
   * Convert Address to Nodemailer format
   *
   * @returns String in format "Name <email>" or just "email"
   */
  public toString(): string {
    return this.name ? `"${this.name}" <${this.email}>` : this.email;
  }
}
