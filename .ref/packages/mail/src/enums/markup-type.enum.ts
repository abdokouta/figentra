/**
 * Email Markup Type Enum
 *
 * Types of structured data markup supported in emails
 * Based on Google Gmail markup specification
 *
 * @enum MarkupType
 * @see {@link https://developers.google.com/workspace/gmail/markup/reference}
 */
export enum MarkupType {
  /**
   * Order confirmation and tracking
   */
  ORDER = 'Order',

  /**
   * Parcel delivery tracking
   */
  PARCEL_DELIVERY = 'ParcelDelivery',

  /**
   * Invoice
   */
  INVOICE = 'Invoice',

  /**
   * Bus reservation
   */
  BUS_RESERVATION = 'BusReservation',

  /**
   * Event reservation
   */
  EVENT_RESERVATION = 'EventReservation',

  /**
   * Flight reservation
   */
  FLIGHT_RESERVATION = 'FlightReservation',

  /**
   * Hotel reservation
   */
  LODGING_RESERVATION = 'LodgingReservation',

  /**
   * Rental car reservation
   */
  RENTAL_CAR_RESERVATION = 'RentalCarReservation',

  /**
   * Restaurant reservation
   */
  FOOD_ESTABLISHMENT_RESERVATION = 'FoodEstablishmentReservation',

  /**
   * Train reservation
   */
  TRAIN_RESERVATION = 'TrainReservation',

  /**
   * One-click action
   */
  ONE_CLICK_ACTION = 'OneClickAction',

  /**
   * Go-to action
   */
  GO_TO_ACTION = 'GoToAction',
}
