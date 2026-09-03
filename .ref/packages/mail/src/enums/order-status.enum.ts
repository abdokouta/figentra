/**
 * Order Status Enum
 *
 * Status values for order tracking
 *
 * @enum OrderStatus
 */
export enum OrderStatus {
  /**
   * Order has been cancelled
   */
  CANCELLED = 'OrderCancelled',

  /**
   * Order has been delivered
   */
  DELIVERED = 'OrderDelivered',

  /**
   * Order is in transit
   */
  IN_TRANSIT = 'OrderInTransit',

  /**
   * Payment is due
   */
  PAYMENT_DUE = 'OrderPaymentDue',

  /**
   * Order is being picked up
   */
  PICKUP_AVAILABLE = 'OrderPickupAvailable',

  /**
   * Order is being processed
   */
  PROCESSING = 'OrderProcessing',

  /**
   * Order problem
   */
  PROBLEM = 'OrderProblem',

  /**
   * Order has been returned
   */
  RETURNED = 'OrderReturned',
}
