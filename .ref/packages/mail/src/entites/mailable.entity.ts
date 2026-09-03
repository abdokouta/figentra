import { Address } from './address.class';
import { Attachment } from './attachment.class';

/**
 * Abstract Mailable Class
 *
 * Base class for creating reusable email templates inspired by Laravel.
 * Extend this class to create custom email classes with fluent API support.
 *
 * @example
 * ```typescript
 * export class OrderShippedMailable extends Mailable {
 *   constructor(private order: Order) {
 *     super();
 *   }
 *
 *   build() {
 *     return this
 *       .subject(`Order ${this.order.id} Shipped`)
 *       .template('emails/order-shipped')
 *       .with('order', this.order)
 *       .attach(
 *         Attachment.fromPath('/path/to/invoice.pdf')
 *           .as('invoice.pdf')
 *       );
 *   }
 * }
 *
 * // Usage
 * await mailService.to('user@example.com').send(OrderShippedMailable.make(order));
 * await mailService.to('user@example.com').queue(OrderShippedMailable.make(order));
 * ```
 */
export abstract class Mailable {
  /**
   * Email subject
   */
  protected _subject?: string;

  /**
   * Template name
   */
  protected _template?: string;

  /**
   * Template context/view data
   */
  protected _viewData: Record<string, any> = {};

  /**
   * Email locale
   */
  protected _locale?: string;

  /**
   * From address
   */
  protected _from?: Address;

  /**
   * To recipients
   */
  protected _to: Address[] = [];

  /**
   * CC recipients
   */
  protected _cc: Address[] = [];

  /**
   * BCC recipients
   */
  protected _bcc: Address[] = [];

  /**
   * Reply-To addresses
   */
  protected _replyTo: Address[] = [];

  /**
   * Attachments
   */
  protected _attachments: Attachment[] = [];

  /**
   * Priority level (1=highest, 5=lowest)
   */
  protected _priority?: number;

  /**
   * Queue name for queued emails
   */
  public queue?: string;

  /**
   * Queue connection name
   */
  public connection?: string;

  /**
   * Delay before sending (for later() method)
   */
  public delay?: number;

  /**
   * Custom headers
   */
  protected _headers: Record<string, string> = {};

  /**
   * Tags for email tracking
   */
  protected _tags: string[] = [];

  /**
   * Metadata for email tracking
   */
  protected _metadata: Record<string, string> = {};

  /**
   * Build the email
   * Override this method to configure your email
   *
   * @returns this for chaining
   */
  abstract build(): this;

  /**
   * Set the email subject
   *
   * @param subject - Email subject line
   * @returns this for chaining
   */
  public subject(subject: string): this {
    this._subject = subject;
    return this;
  }

  /**
   * Set the template name
   *
   * @param template - Template file name (without extension)
   * @returns this for chaining
   */
  public template(template: string): this {
    this._template = template;
    return this;
  }

  /**
   * Add data to template context
   *
   * @param key - Data key or object of key-value pairs
   * @param value - Data value (if key is string)
   * @returns this for chaining
   */
  public with(key: string | Record<string, any>, value?: any): this {
    if (typeof key === 'object') {
      this._viewData = { ...this._viewData, ...key };
    } else {
      this._viewData[key] = value;
    }
    return this;
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
   * Set the from address
   *
   * @param address - Email address or Address object
   * @param name - Sender name (optional)
   * @returns this for chaining
   */
  public from(address: string | Address, name?: string): this {
    this._from = address instanceof Address ? address : Address.make(address, name);
    return this;
  }

  /**
   * Add to recipient(s)
   *
   * @param address - Email address(es)
   * @param name - Recipient name (optional)
   * @returns this for chaining
   */
  public to(address: string | Address | Array<string | Address>, name?: string): this {
    const addresses = Array.isArray(address) ? address : [address];
    addresses.forEach((addr) => {
      this._to.push(addr instanceof Address ? addr : Address.make(addr, name));
    });
    return this;
  }

  /**
   * Add CC recipient(s)
   *
   * @param address - Email address(es)
   * @param name - Recipient name (optional)
   * @returns this for chaining
   */
  public cc(address: string | Address | Array<string | Address>, name?: string): this {
    const addresses = Array.isArray(address) ? address : [address];
    addresses.forEach((addr) => {
      this._cc.push(addr instanceof Address ? addr : Address.make(addr, name));
    });
    return this;
  }

  /**
   * Add BCC recipient(s)
   *
   * @param address - Email address(es)
   * @param name - Recipient name (optional)
   * @returns this for chaining
   */
  public bcc(address: string | Address | Array<string | Address>, name?: string): this {
    const addresses = Array.isArray(address) ? address : [address];
    addresses.forEach((addr) => {
      this._bcc.push(addr instanceof Address ? addr : Address.make(addr, name));
    });
    return this;
  }

  /**
   * Add reply-to address(es)
   *
   * @param address - Email address(es)
   * @param name - Name (optional)
   * @returns this for chaining
   */
  public replyTo(address: string | Address | Array<string | Address>, name?: string): this {
    const addresses = Array.isArray(address) ? address : [address];
    addresses.forEach((addr) => {
      this._replyTo.push(addr instanceof Address ? addr : Address.make(addr, name));
    });
    return this;
  }

  /**
   * Attach file(s) to the email
   *
   * @param attachments - Single or array of Attachment instances
   * @returns this for chaining
   */
  public attach(...attachments: Attachment[]): this {
    this._attachments.push(...attachments);
    return this;
  }

  /**
   * Set email priority
   *
   * @param level - Priority level (1=highest, 5=lowest, 3=normal)
   * @returns this for chaining
   */
  public priority(level: number): this {
    this._priority = level;
    return this;
  }

  /**
   * Add custom header
   *
   * @param key - Header name
   * @param value - Header value
   * @returns this for chaining
   */
  public header(key: string, value: string): this {
    this._headers[key] = value;
    return this;
  }

  /**
   * Add tag for email tracking
   *
   * @param tag - Tag name
   * @returns this for chaining
   */
  public tag(tag: string): this {
    this._tags.push(tag);
    return this;
  }

  /**
   * Add metadata for email tracking
   *
   * @param key - Metadata key or object
   * @param value - Metadata value (if key is string)
   * @returns this for chaining
   */
  public metadata(key: string | Record<string, string>, value?: string): this {
    if (typeof key === 'object') {
      this._metadata = { ...this._metadata, ...key };
    } else if (value !== undefined) {
      this._metadata[key] = value;
    }
    return this;
  }

  /**
   * Get all email data for sending
   * @internal
   */
  public toMailData(): any {
    return {
      tags: this._tags,
      locale: this._locale,
      headers: this._headers,
      subject: this._subject,
      context: this._viewData,
      priority: this._priority,
      metadata: this._metadata,
      template: this._template,
      from: this._from?.toString(),
      to: this._to.map((a) => a.toString()),
      cc: this._cc.map((a) => a.toString()),
      bcc: this._bcc.map((a) => a.toString()),
      replyTo: this._replyTo.map((a) => a.toString()),
      attachments: this._attachments.map((a) => a.toNodemailerFormat()),
    };
  }

  /**
   * Get queue configuration
   * @internal
   */
  public getQueueConfig(): { queue?: string; connection?: string; delay?: number } {
    return {
      queue: this.queue,
      delay: this.delay,
      connection: this.connection,
    };
  }
}
