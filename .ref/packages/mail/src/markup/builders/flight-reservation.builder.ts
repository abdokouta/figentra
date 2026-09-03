import { ReservationStatus } from '@enums';
import { BaseMarkupBuilder } from './base-markup.builder';
import { IFlightReservation, IOrganization, IPerson } from '@markup/schemas';

/**
 * Flight Reservation Markup Builder
 *
 * Builder class for creating flight reservation markup
 *
 * @class FlightReservationBuilder
 * @extends {BaseMarkupBuilder<IFlightReservation>}
 *
 * @example
 * ```typescript
 * const flightMarkup = FlightReservationBuilder.make()
 *   .setReservationNumber('ABC123')
 *   .setStatus(ReservationStatus.CONFIRMED)
 *   .setUnderName({ '@type': 'Person', name: 'John Doe', email: 'john@example.com' })
 *   .setFlight({
 *     flightNumber: 'AA100',
 *     airline: { '@type': 'Organization', name: 'American Airlines' },
 *     departureAirport: { '@type': 'Airport', name: 'JFK', iataCode: 'JFK' },
 *     departureTime: '2024-01-15T10:00:00Z',
 *     arrivalAirport: { '@type': 'Airport', name: 'LAX', iataCode: 'LAX' },
 *     arrivalTime: '2024-01-15T14:00:00Z',
 *   })
 *   .build();
 * ```
 */
export class FlightReservationBuilder extends BaseMarkupBuilder<IFlightReservation> {
  /**
   * Reservation confirmation number
   *
   * @private
   */
  private reservationNumber!: string;

  /**
   * Current status of the reservation
   *
   * @private
   */
  private reservationStatus!: ReservationStatus;

  /**
   * Passenger name (person or organization)
   *
   * @private
   */
  private underName!: IPerson | IOrganization;

  /**
   * Flight details including airline, airports, and times
   *
   * @private
   */
  private flight!: IFlightReservation['reservationFor'];

  /**
   * Boarding pass information (optional)
   *
   * @private
   */
  private boardingPass?: IFlightReservation['boardingPass'];

  /**
   * Booking timestamp in ISO 8601 format (optional)
   *
   * @private
   */
  private bookingTime?: string;

  /**
   * Confirmation URL (optional)
   *
   * @private
   */
  private url?: string;

  /**
   * Sets the reservation number
   *
   * @param number - Reservation number
   * @returns This builder instance
   */
  setReservationNumber(number: string): this {
    this.reservationNumber = number;
    return this;
  }

  /**
   * Sets the reservation status
   *
   * @param status - Reservation status
   * @returns This builder instance
   */
  setStatus(status: ReservationStatus): this {
    this.reservationStatus = status;
    return this;
  }

  /**
   * Sets the passenger name
   *
   * @param name - Passenger details
   * @returns This builder instance
   */
  setUnderName(name: IPerson | IOrganization): this {
    this.underName = name;
    return this;
  }

  /**
   * Sets the flight details
   *
   * @param flight - Flight details
   * @returns This builder instance
   */
  setFlight(flight: IFlightReservation['reservationFor']): this {
    this.flight = flight;
    return this;
  }

  /**
   * Sets the boarding pass details
   *
   * @param pass - Boarding pass details
   * @returns This builder instance
   */
  setBoardingPass(pass: IFlightReservation['boardingPass']): this {
    this.boardingPass = pass;
    return this;
  }

  /**
   * Sets the booking time
   *
   * @param time - Booking time (ISO 8601 format)
   * @returns This builder instance
   */
  setBookingTime(time: string): this {
    this.bookingTime = time;
    return this;
  }

  /**
   * Sets the confirmation URL
   *
   * @param url - Confirmation URL
   * @returns This builder instance
   */
  setUrl(url: string): this {
    this.url = url;
    return this;
  }

  /**
   * Builds the flight reservation markup
   *
   * @returns Complete flight reservation markup object
   */
  build(): IFlightReservation {
    if (!this.reservationNumber) {
      throw new Error('Reservation number is required');
    }
    if (!this.reservationStatus) {
      throw new Error('Reservation status is required');
    }
    if (!this.underName) {
      throw new Error('Passenger name is required');
    }
    if (!this.flight) {
      throw new Error('Flight details are required');
    }

    const reservation: IFlightReservation = {
      '@context': this.context,
      '@type': 'FlightReservation',

      underName: this.underName,
      reservationFor: this.flight,
      reservationNumber: this.reservationNumber,
      reservationStatus: this.reservationStatus,
    };

    if (this.url) reservation.url = this.url;
    if (this.bookingTime) reservation.bookingTime = this.bookingTime;
    if (this.boardingPass) reservation.boardingPass = this.boardingPass;

    return reservation;
  }
}
