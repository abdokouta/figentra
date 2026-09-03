import { Address } from './address.class';
import { Mailable } from './mailable.class';

/**
 * HasLocalePreference Interface
 *
 * Interface for objects that have a preferred locale
 * (e.g., User models with locale preference)
 */
export interface HasLocalePreference {
  preferredLocale(): string;
}

/**
 * PendingMail Class
 *
 * Fluent builder for composing and sending emails inspired by Laravel.
 * Provides chainable methods for setting recipients, locale, and sending options.
 *
 * @example
 * ```typescript
 * // Fluent API
 * await mailService
 *   .to('user@example.com')
 *   .cc('manager@example.com')
 *   .locale('es')
 *   .send(OrderShipped.make(order));
 *
 * // Queue for async processing
 * await mailService
 *   .to(user)  // Auto-detects user's preferred locale
 *   .queue(WelcomeMailable.make(user));
 *
 * // Schedule for later
 * await mailService
 *   .to('user@example.com')
 *   .later(3600, ReminderMailable.make()); // 1 hour delay
 * ```
 */
export class PendingMail {
  /**
   * Locale for the email
   */
  private _locale?: string;

  /**
   * To recipients
   */
  private _to: Address[] = [];

  /**
   * CC recipients
   */
  private _cc: Address[] = [];

  /**
   * BCC recipients
   */
  private _bcc: Address[] = [];

  /**
   * Reply-To addresses
   */
  private _replyTo: Address[] = [];

  /**
   * Mail service instance for sending
   */
  private mailService: any;

  /**
   * Create a new PendingMail instance
   *
   * @param mailService - The mail service instance
   */
  constructor(mailService: any) {
    this.mailService = mailService;
  }

  /**
   * Set the email locale
   *
   * @param locale - Locale code (e.g., 'en', 'es', 'fr')
   * @returns this for chaining
   */
  public locale(locale: string): this {
    this._locale = locale;
    return this;
  }

  /**
   * Set to recipient(s)
   *
   * @param users - Email address(es) or user object(s) with email
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * .to('user@example.com')
   * .to(['user1@example.com', 'user2@example.com'])
   * .to(user) // Object with email property and optional preferredLocale()
   * ```
   */
  public to(
    users: string | Address | HasLocalePreference | any | Array<string | Address | any>,
  ): this {
    const userArray = Array.isArray(users) ? users : [users];

    userArray.forEach((user) => {
      // Auto-detect preferred locale from user object
      if (!this._locale && user && typeof user === 'object' && 'preferredLocale' in user) {
        this._locale = (user as HasLocalePreference).preferredLocale();
      }

      // Convert to Address
      if (typeof user === 'string') {
        this._to.push(Address.make(user));
      } else if (user instanceof Address) {
        this._to.push(user);
      } else if (user && typeof user === 'object' && 'email' in user) {
        this._to.push(Address.make(user.email, user.name));
      }
    });

    return this;
  }

  /**
   * Set CC recipient(s)
   *
   * @param users - Email address(es) or user object(s)
   * @returns this for chaining
   */
  public cc(users: string | Address | any | Array<string | Address | any>): this {
    const userArray = Array.isArray(users) ? users : [users];

    userArray.forEach((user) => {
      if (typeof user === 'string') {
        this._cc.push(Address.make(user));
      } else if (user instanceof Address) {
        this._cc.push(user);
      } else if (user && typeof user === 'object' && 'email' in user) {
        this._cc.push(Address.make(user.email, user.name));
      }
    });

    return this;
  }

  /**
   * Set BCC recipient(s)
   *
   * @param users - Email address(es) or user object(s)
   * @returns this for chaining
   */
  public bcc(users: string | Address | any | Array<string | Address | any>): this {
    const userArray = Array.isArray(users) ? users : [users];

    userArray.forEach((user) => {
      if (typeof user === 'string') {
        this._bcc.push(Address.make(user));
      } else if (user instanceof Address) {
        this._bcc.push(user);
      } else if (user && typeof user === 'object' && 'email' in user) {
        this._bcc.push(Address.make(user.email, user.name));
      }
    });

    return this;
  }

  /**
   * Set reply-to address(es)
   *
   * @param addresses - Email address(es)
   * @returns this for chaining
   */
  public replyTo(addresses: string | Address | Array<string | Address>): this {
    const addressArray = Array.isArray(addresses) ? addresses : [addresses];

    addressArray.forEach((addr) => {
      if (typeof addr === 'string') {
        this._replyTo.push(Address.make(addr));
      } else if (addr instanceof Address) {
        this._replyTo.push(addr);
      }
    });

    return this;
  }

  /**
   * Send the mailable immediately
   *
   * @param mailable - Mailable instance to send
   * @returns Promise resolving when email is sent
   *
   * @example
   * ```typescript
   * await mailService
   *   .to('user@example.com')
   *   .send(OrderShipped.make(order));
   * ```
   */
  public async send(mailable: Mailable): Promise<any> {
    return this.mailService.sendMailable(this.fill(mailable));
  }

  /**
   * Queue the mailable for async processing
   *
   * @param mailable - Mailable instance to queue
   * @returns Promise resolving when queued
   *
   * @example
   * ```typescript
   * await mailService
   *   .to('user@example.com')
   *   .queue(OrderShipped.make(order));
   * ```
   */
  public async queue(mailable: Mailable): Promise<any> {
    return this.mailService.queueMailable(this.fill(mailable));
  }

  /**
   * Queue the mailable for delivery after a delay
   *
   * @param delay - Delay in seconds
   * @param mailable - Mailable instance to send
   * @returns Promise resolving when queued
   *
   * @example
   * ```typescript
   * // Send after 1 hour (3600 seconds)
   * await mailService
   *   .to('user@example.com')
   *   .later(3600, ReminderMailable.make());
   * ```
   */
  public async later(delay: number, mailable: Mailable): Promise<any> {
    mailable.delay = delay;
    return this.queue(mailable);
  }

  /**
   * Fill the mailable with pending data
   *
   * @param mailable - Mailable to populate
   * @returns Populated mailable
   * @private
   */
  private fill(mailable: Mailable): Mailable {
    // Call build() to configure the email
    mailable.build();

    // Apply pending recipients
    if (this._to.length > 0) {
      mailable.to(this._to);
    }

    if (this._cc.length > 0) {
      mailable.cc(this._cc);
    }

    if (this._bcc.length > 0) {
      mailable.bcc(this._bcc);
    }

    if (this._replyTo.length > 0) {
      mailable.replyTo(this._replyTo);
    }

    // Apply locale
    if (this._locale) {
      mailable.locale(this._locale);
    }

    return mailable;
  }
}
