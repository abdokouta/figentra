import { OrderStatus } from '@enums';
import { BaseMarkupBuilder } from './base-markup.builder';
import { IOrder, IOrderItem, IOrganization, IParcelDelivery } from '@markup/schemas';

/**
 * Order Markup Builder
 *
 * Builder class for creating order confirmation markup
 *
 * @class OrderMarkupBuilder
 * @extends {BaseMarkupBuilder<IOrder>}
 *
 * @example
 * ```typescript
 * const orderMarkup = OrderMarkupBuilder.make()
 *   .setOrderNumber('ORD-12345')
 *   .setMerchant({ '@type': 'Organization', name: 'Example Store' })
 *   .setOrderStatus(OrderStatus.PROCESSING)
 *   .setPrice(99.99, 'USD')
 *   .setOrderDate('2024-01-15T10:00:00Z')
 *   .build();
 * ```
 */
export class OrderMarkupBuilder extends BaseMarkupBuilder<IOrder> {
  /**
   * Order confirmation number
   *
   * @private
   */
  private orderNumber!: string;

  /**
   * Merchant organization details
   *
   * @private
   */
  private merchant!: IOrganization;

  /**
   * Current order status (optional)
   *
   * @private
   */
  private orderStatus?: OrderStatus;

  /**
   * Order total price (optional)
   *
   * @private
   */
  private price?: string | number;

  /**
   * Currency code in ISO 4217 format (optional)
   *
   * @private
   */
  private priceCurrency?: string;

  /**
   * Order date in ISO 8601 format (optional)
   *
   * @private
   */
  private orderDate?: string;

  /**
   * Customer organization details (optional)
   *
   * @private
   */
  private customer?: IOrganization;

  /**
   * Order delivery/shipping information (optional)
   *
   * @private
   */
  private orderDelivery?: IParcelDelivery;

  /**
   * Array of ordered items (optional)
   *
   * @private
   */
  private orderedItems?: IOrderItem[];

  /**
   * Order confirmation URL (optional)
   *
   * @private
   */
  private url?: string;

  /**
   * Sets the order number
   *
   * @param orderNumber - Order number/ID
   * @returns This builder instance
   */
  setOrderNumber(orderNumber: string): this {
    this.orderNumber = orderNumber;
    return this;
  }

  /**
   * Sets the merchant organization
   *
   * @param merchant - Merchant details
   * @returns This builder instance
   */
  setMerchant(merchant: IOrganization): this {
    this.merchant = merchant;
    return this;
  }

  /**
   * Sets the order status
   *
   * @param status - Order status
   * @returns This builder instance
   */
  setOrderStatus(status: OrderStatus): this {
    this.orderStatus = status;
    return this;
  }

  /**
   * Sets the order price
   *
   * @param price - Order total price
   * @param currency - Currency code (ISO 4217)
   * @returns This builder instance
   */
  setPrice(price: string | number, currency: string): this {
    this.price = price;
    this.priceCurrency = currency;
    return this;
  }

  /**
   * Sets the order date
   *
   * @param date - Order date (ISO 8601 format)
   * @returns This builder instance
   */
  setOrderDate(date: string): this {
    this.orderDate = date;
    return this;
  }

  /**
   * Sets the customer
   *
   * @param customer - Customer details
   * @returns This builder instance
   */
  setCustomer(customer: IOrganization): this {
    this.customer = customer;
    return this;
  }

  /**
   * Sets the order delivery details
   *
   * @param delivery - Delivery details
   * @returns This builder instance
   */
  setOrderDelivery(delivery: IParcelDelivery): this {
    this.orderDelivery = delivery;
    return this;
  }

  /**
   * Sets the ordered items
   *
   * @param items - Array of ordered items
   * @returns This builder instance
   */
  setOrderedItems(items: IOrderItem[]): this {
    this.orderedItems = items;
    return this;
  }

  /**
   * Sets the confirmation URL
   *
   * @param url - Order confirmation URL
   * @returns This builder instance
   */
  setUrl(url: string): this {
    this.url = url;
    return this;
  }

  /**
   * Builds the order markup
   *
   * @returns Complete order markup object
   */
  build(): IOrder {
    if (!this.orderNumber) {
      throw new Error('Order number is required');
    }
    if (!this.merchant) {
      throw new Error('Merchant is required');
    }

    const order: IOrder = {
      '@context': this.context,
      '@type': 'Order',
      orderNumber: this.orderNumber,
      merchant: this.merchant,
    };

    if (this.url) order.url = this.url;
    if (this.price) order.price = this.price;
    if (this.customer) order.customer = this.customer;
    if (this.orderDate) order.orderDate = this.orderDate;
    if (this.orderStatus) order.orderStatus = this.orderStatus;
    if (this.orderedItems) order.orderedItem = this.orderedItems;
    if (this.priceCurrency) order.priceCurrency = this.priceCurrency;
    if (this.orderDelivery) order.orderDelivery = this.orderDelivery;

    return order;
  }
}
