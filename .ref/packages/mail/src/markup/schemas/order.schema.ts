import {
  IBaseMarkup,
  IOrganization,
  IPostalAddress,
  IPriceSpecification,
} from './base-markup.schema';
import { OrderStatus } from '@enums';

/**
 * Order Item Schema
 *
 * Represents an item in an order
 *
 * @interface IOrderItem
 */
export interface IOrderItem {
  '@type': 'OrderItem';

  /**
   * Ordered item
   */
  orderedItem: {
    '@type': 'Product';

    /**
     * Product name
     */
    name: string;
    /**
     * Product image URL
     */
    image?: string;
    /**
     * Product URL
     */
    url?: string;
  };

  /**
   * Order quantity
   */
  orderQuantity: number;

  /**
   * Order item number/ID
   */
  orderItemNumber?: string;

  /**
   * Order item status
   */
  orderItemStatus?: OrderStatus;

  /**
   * Order delivery
   */
  orderDelivery?: IParcelDelivery;
}

/**
 * Parcel Delivery Schema
 *
 * Represents a parcel delivery
 *
 * @interface IParcelDelivery
 */
export interface IParcelDelivery {
  '@type': 'ParcelDelivery';

  /**
   * Delivery address
   */
  deliveryAddress: IPostalAddress;

  /**
   * Expected arrival time
   */
  expectedArrivalFrom?: string;

  /**
   * Expected arrival until
   */
  expectedArrivalUntil?: string;

  /**
   * Carrier
   */
  carrier?: IOrganization;

  /**
   * Tracking number
   */
  trackingNumber?: string;

  /**
   * Tracking URL
   */
  trackingUrl?: string;

  /**
   * Delivery status
   */
  deliveryStatus?: string;
}

/**
 * Order Schema
 *
 * Represents an order confirmation
 *
 * @interface IOrder
 * @extends {IBaseMarkup}
 */
export interface IOrder extends IBaseMarkup {
  '@type': 'Order';

  /**
   * Order number
   */
  orderNumber: string;

  /**
   * Price specification
   */
  priceSpecification?: IPriceSpecification;

  /**
   * Order status
   */
  orderStatus?: OrderStatus;

  /**
   * Merchant
   */
  merchant: IOrganization;

  /**
   * Customer
   */
  customer?: IOrganization;

  /**
   * Order date
   */
  orderDate?: string;

  /**
   * Accepted offer
   */
  acceptedOffer?: {
    '@type': 'Offer';

    /**
     * Item offered
     */
    itemOffered: {
      '@type': 'Product';
      /**
       * Product name
       */
      name: string;
    };

    /**
     * Price
     */
    price: string | number;

    /**
     * Price currency
     */
    priceCurrency: string;
  };

  /**
   * Order delivery
   */
  orderDelivery?: IParcelDelivery;

  /**
   * Ordered items
   */
  orderedItem?: IOrderItem[];

  /**
   * Confirmation URL
   */
  url?: string;

  /**
   * Order total price
   */
  price?: string | number;

  /**
   * Price currency
   */
  priceCurrency?: string;
}
