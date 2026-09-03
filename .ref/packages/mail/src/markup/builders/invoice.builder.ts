import { OrderStatus } from '@enums';
import { BaseMarkupBuilder } from './base-markup.builder';
import { IOrder, IOrderItem, IOrganization } from '@markup/schemas';

/**
 * Invoice Builder
 *
 * Builder class for creating invoice markup. Uses the Order schema
 * as invoices are essentially orders with payment information.
 *
 * @class InvoiceBuilder
 * @extends {BaseMarkupBuilder<IOrder>}
 *
 * @example Basic invoice
 * ```typescript
 * const invoiceMarkup = InvoiceBuilder.make()
 *   .setInvoiceNumber('INV-2024-001')
 *   .setBiller({ '@type': 'Organization', name: 'Acme Corp', email: 'billing@acme.com' })
 *   .setCustomer({ '@type': 'Organization', name: 'Client Inc', email: 'accounts@client.com' })
 *   .setStatus(OrderStatus.PROCESSING)
 *   .setTotal(1500.00, 'USD')
 *   .setInvoiceDate('2024-01-15T10:00:00Z')
 *   .setItems([
 *     {
 *       '@type': 'OrderItem',
 *       orderItemNumber: '1',
 *       orderQuantity: 10,
 *       orderedItem: {
 *         '@type': 'Product',
 *         name: 'Professional Services',
 *       },
 *       price: 150.00,
 *       priceCurrency: 'USD',
 *     },
 *   ])
 *   .setUrl('https://example.com/invoices/INV-2024-001')
 *   .build();
 * ```
 *
 * @example Invoice with multiple line items
 * ```typescript
 * const detailedInvoice = InvoiceBuilder.make()
 *   .setInvoiceNumber('INV-2024-042')
 *   .setBiller({
 *     '@type': 'Organization',
 *     name: 'Design Studio LLC',
 *     email: 'invoices@designstudio.com',
 *   })
 *   .setCustomer({
 *     '@type': 'Person',
 *     name: 'John Smith',
 *     email: 'john@example.com',
 *   })
 *   .setStatus(OrderStatus.DELIVERED)
 *   .setTotal(3250.00, 'USD')
 *   .setInvoiceDate('2024-02-01T09:00:00Z')
 *   .setItems([
 *     {
 *       '@type': 'OrderItem',
 *       orderItemNumber: '1',
 *       orderQuantity: 1,
 *       orderedItem: { '@type': 'Product', name: 'Website Design' },
 *       price: 2000.00,
 *       priceCurrency: 'USD',
 *     },
 *     {
 *       '@type': 'OrderItem',
 *       orderItemNumber: '2',
 *       orderQuantity: 5,
 *       orderedItem: { '@type': 'Product', name: 'Logo Concepts' },
 *       price: 250.00,
 *       priceCurrency: 'USD',
 *     },
 *   ])
 *   .build();
 * ```
 */
export class InvoiceBuilder extends BaseMarkupBuilder<IOrder> {
  /**
   * Invoice number
   *
   * @private
   */
  private invoiceNumber!: string;

  /**
   * Billing organization/person
   *
   * @private
   */
  private biller!: IOrganization;

  /**
   * Customer organization/person (optional)
   *
   * @private
   */
  private customer?: IOrganization;

  /**
   * Invoice status (optional)
   *
   * @private
   */
  private status?: OrderStatus;

  /**
   * Total amount (optional)
   *
   * @private
   */
  private total?: string | number;

  /**
   * Currency code in ISO 4217 format (optional)
   *
   * @private
   */
  private currency?: string;

  /**
   * Invoice date in ISO 8601 format (optional)
   *
   * @private
   */
  private invoiceDate?: string;

  /**
   * Due date in ISO 8601 format (optional)
   *
   * @private
   */
  private dueDate?: string;

  /**
   * Invoice line items (optional)
   *
   * @private
   */
  private items?: IOrderItem[];

  /**
   * Invoice URL (optional)
   *
   * @private
   */
  private url?: string;

  /**
   * Sets the invoice number
   *
   * @param number - Invoice number/ID
   * @returns This builder instance
   */
  setInvoiceNumber(number: string): this {
    this.invoiceNumber = number;
    return this;
  }

  /**
   * Sets the biller (merchant/seller)
   *
   * @param biller - Biller organization/person details
   * @returns This builder instance
   */
  setBiller(biller: IOrganization): this {
    this.biller = biller;
    return this;
  }

  /**
   * Sets the customer (buyer)
   *
   * @param customer - Customer organization/person details
   * @returns This builder instance
   */
  setCustomer(customer: IOrganization): this {
    this.customer = customer;
    return this;
  }

  /**
   * Sets the invoice status
   *
   * @param status - Invoice status (PROCESSING = unpaid, DELIVERED = paid)
   * @returns This builder instance
   */
  setStatus(status: OrderStatus): this {
    this.status = status;
    return this;
  }

  /**
   * Sets the total amount
   *
   * @param amount - Total amount
   * @param currency - Currency code (ISO 4217)
   * @returns This builder instance
   */
  setTotal(amount: string | number, currency: string): this {
    this.total = amount;
    this.currency = currency;
    return this;
  }

  /**
   * Sets the invoice date
   *
   * @param date - Invoice date (ISO 8601 format)
   * @returns This builder instance
   */
  setInvoiceDate(date: string): this {
    this.invoiceDate = date;
    return this;
  }

  /**
   * Sets the due date
   *
   * @param date - Due date (ISO 8601 format)
   * @returns This builder instance
   */
  setDueDate(date: string): this {
    this.dueDate = date;
    return this;
  }

  /**
   * Sets the invoice line items
   *
   * @param items - Array of invoice line items
   * @returns This builder instance
   */
  setItems(items: IOrderItem[]): this {
    this.items = items;
    return this;
  }

  /**
   * Sets the invoice URL
   *
   * @param url - Invoice URL
   * @returns This builder instance
   */
  setUrl(url: string): this {
    this.url = url;
    return this;
  }

  /**
   * Builds the invoice markup
   *
   * @returns Complete invoice markup object
   * @throws Error if required fields are missing
   */
  build(): IOrder {
    if (!this.invoiceNumber) {
      throw new Error('Invoice number is required');
    }
    if (!this.biller) {
      throw new Error('Biller is required');
    }

    const invoice: IOrder = {
      '@context': this.context,
      '@type': 'Order',
      orderNumber: this.invoiceNumber,
      merchant: this.biller,
    };

    if (this.url) invoice.url = this.url;
    if (this.total) invoice.price = this.total;
    if (this.currency) invoice.priceCurrency = this.currency;
    if (this.customer) invoice.customer = this.customer;
    if (this.invoiceDate) invoice.orderDate = this.invoiceDate;
    if (this.status) invoice.orderStatus = this.status;
    if (this.items) invoice.orderedItem = this.items;

    return invoice;
  }
}
