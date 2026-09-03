import { Mailable, Attachment } from '@nesvel/nestjs-mail';

/**
 * Order interface example
 */
interface Order {
  id: string;
  orderNumber: string;
  total: number;
  currency: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface Customer {
  name: string;
  email: string;
  preferredLocale?: string;
}

/**
 * OrderShippedMailable
 *
 * Notifies customers when their order has been shipped.
 *
 * **Features**:
 * - Order details and tracking information
 * - Shipping address confirmation
 * - Estimated delivery date
 * - PDF invoice attachment
 * - Multiple language support
 *
 * @example Basic usage
 * ```typescript
 * const mailable = OrderShippedMailable.make(order, customer);
 * await mailService.to(customer.email).send(mailable);
 * ```
 *
 * @example With invoice attachment
 * ```typescript
 * const mailable = OrderShippedMailable.make(order, customer, '/tmp/invoice.pdf');
 * await mailService.to(customer.email).send(mailable);
 * ```
 *
 * @example Queue with high priority
 * ```typescript
 * import { MAIL_JOB_PRIORITIES } from '@nesvel/nestjs-mail';
 *
 * const mailable = OrderShippedMailable.make(order, customer);
 * await mailService
 *   .to(customer.email)
 *   .queue(mailable, { priority: MAIL_JOB_PRIORITIES.HIGH });
 * ```
 */
export class OrderShippedMailable extends Mailable {
  /**
   * Creates an order shipped email instance
   *
   * @param order - Order that was shipped
   * @param customer - Customer who placed the order
   * @param invoicePath - Optional path to PDF invoice
   */
  constructor(
    private readonly order: Order,
    private readonly customer: Customer,
    private readonly invoicePath?: string,
  ) {
    super();
  }

  /**
   * Build the email content and configuration
   *
   * @returns this for method chaining
   */
  build(): this {
    // Format currency
    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.order.currency || 'USD',
    }).format(this.order.total);

    // Build base email
    this.subject(`Your Order #${this.order.orderNumber} Has Shipped! 📦`)
      .template('emails/order-shipped')
      .locale(this.customer.preferredLocale || 'en')
      .with({
        customerName: this.customer.name,
        orderId: this.order.id,
        orderNumber: this.order.orderNumber,
        orderTotal: formattedTotal,
        trackingNumber: this.order.trackingNumber,
        trackingUrl: this.order.trackingUrl,
        carrier: this.order.carrier,
        estimatedDelivery: this.order.estimatedDelivery?.toLocaleDateString(),
        shippingAddress: this.order.shippingAddress,
        items: this.order.items,
        itemCount: this.order.items.length,
        orderUrl: `${process.env.APP_URL}/orders/${this.order.id}`,
        supportUrl: `${process.env.APP_URL}/support`,
        year: new Date().getFullYear(),
      })
      .priority(3); // High priority transactional email

    // Attach invoice if provided
    if (this.invoicePath) {
      this.attach(
        Attachment.fromPath(this.invoicePath)
          .as(`invoice-${this.order.orderNumber}.pdf`)
          .withMime('application/pdf'),
      );
    }

    return this;
  }
}
