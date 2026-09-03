/**
 * Reservation Status Enum
 *
 * Status values for reservations
 *
 * @enum ReservationStatus
 */
export enum ReservationStatus {
  /**
   * Reservation has been cancelled
   */
  CANCELLED = 'ReservationCancelled',

  /**
   * Reservation has been confirmed
   */
  CONFIRMED = 'ReservationConfirmed',

  /**
   * Reservation is on hold
   */
  HOLD = 'ReservationHold',

  /**
   * Reservation is pending
   */
  PENDING = 'ReservationPending',
}
