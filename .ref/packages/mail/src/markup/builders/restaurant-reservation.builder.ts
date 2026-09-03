import { ReservationStatus } from '@enums';
import { BaseMarkupBuilder } from './base-markup.builder';
import {
  IFoodEstablishmentReservation,
  IOrganization,
  IPerson,
  IPostalAddress,
} from '@markup/schemas';

/**
 * Restaurant Reservation Builder
 *
 * Builder class for creating restaurant reservation markup
 *
 * @class RestaurantReservationBuilder
 * @extends {BaseMarkupBuilder<IFoodEstablishmentReservation>}
 *
 * @example Basic restaurant reservation
 * ```typescript
 * const reservationMarkup = RestaurantReservationBuilder.make()
 *   .setReservationNumber('RES-123456')
 *   .setStatus(ReservationStatus.CONFIRMED)
 *   .setGuestName({ '@type': 'Person', name: 'John Doe', email: 'john@example.com' })
 *   .setRestaurant(
 *     'The Italian Place',
 *     {
 *       '@type': 'PostalAddress',
 *       streetAddress: '456 Dining Street',
 *       addressLocality: 'New York',
 *       addressRegion: 'NY',
 *       postalCode: '10001',
 *       addressCountry: 'US',
 *     },
 *     '+1-212-555-9876'
 *   )
 *   .setStartTime('2024-02-14T19:30:00Z')
 *   .setPartySize(4)
 *   .setUrl('https://example.com/reservations/RES-123456')
 *   .build();
 * ```
 *
 * @example Anniversary dinner reservation
 * ```typescript
 * const dinnerReservation = RestaurantReservationBuilder.make()
 *   .setReservationNumber('DIN-2024-999')
 *   .setStatus(ReservationStatus.CONFIRMED)
 *   .setGuestName({
 *     '@type': 'Person',
 *     name: 'Sarah Johnson',
 *     email: 'sarah@example.com',
 *   })
 *   .setRestaurant('Fine Dining Restaurant', {
 *     '@type': 'PostalAddress',
 *     streetAddress: '789 Gourmet Avenue',
 *     addressLocality: 'San Francisco',
 *     addressRegion: 'CA',
 *     postalCode: '94102',
 *     addressCountry: 'US',
 *   })
 *   .setStartTime('2024-06-15T20:00:00Z')
 *   .setPartySize(2)
 *   .setBookingTime('2024-05-01T10:00:00Z')
 *   .build();
 * ```
 */
export class RestaurantReservationBuilder extends BaseMarkupBuilder<IFoodEstablishmentReservation> {
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
   * Guest name (person or organization)
   *
   * @private
   */
  private underName!: IPerson | IOrganization;

  /**
   * Restaurant name
   *
   * @private
   */
  private restaurantName!: string;

  /**
   * Restaurant address
   *
   * @private
   */
  private restaurantAddress!: IPostalAddress;

  /**
   * Restaurant telephone (optional)
   *
   * @private
   */
  private restaurantTelephone?: string;

  /**
   * Reservation start time in ISO 8601 format
   *
   * @private
   */
  private startTime!: string;

  /**
   * Number of guests/party size
   *
   * @private
   */
  private partySize!: number;

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
   * Sets the guest name
   *
   * @param name - Guest details
   * @returns This builder instance
   */
  setGuestName(name: IPerson | IOrganization): this {
    this.underName = name;
    return this;
  }

  /**
   * Sets the restaurant details
   *
   * @param name - Restaurant name
   * @param address - Restaurant address
   * @param telephone - Restaurant phone number (optional)
   * @returns This builder instance
   */
  setRestaurant(name: string, address: IPostalAddress, telephone?: string): this {
    this.restaurantName = name;
    this.restaurantAddress = address;
    if (telephone) this.restaurantTelephone = telephone;
    return this;
  }

  /**
   * Sets the reservation start time
   *
   * @param time - Reservation start time (ISO 8601 format)
   * @returns This builder instance
   */
  setStartTime(time: string): this {
    this.startTime = time;
    return this;
  }

  /**
   * Sets the party size
   *
   * @param size - Number of guests
   * @returns This builder instance
   */
  setPartySize(size: number): this {
    this.partySize = size;
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
   * Builds the restaurant reservation markup
   *
   * @returns Complete restaurant reservation markup object
   * @throws Error if required fields are missing
   */
  build(): IFoodEstablishmentReservation {
    if (!this.reservationNumber) {
      throw new Error('Reservation number is required');
    }
    if (!this.reservationStatus) {
      throw new Error('Reservation status is required');
    }
    if (!this.underName) {
      throw new Error('Guest name is required');
    }
    if (!this.restaurantName || !this.restaurantAddress) {
      throw new Error('Restaurant name and address are required');
    }
    if (!this.startTime) {
      throw new Error('Reservation start time is required');
    }
    if (!this.partySize) {
      throw new Error('Party size is required');
    }

    const reservation: IFoodEstablishmentReservation = {
      '@context': this.context,
      '@type': 'FoodEstablishmentReservation',

      reservationNumber: this.reservationNumber,
      reservationStatus: this.reservationStatus,
      underName: this.underName,

      reservationFor: {
        '@type': 'FoodEstablishment',
        name: this.restaurantName,
        address: this.restaurantAddress,
      },

      startTime: this.startTime,
      partySize: this.partySize,
    };

    if (this.restaurantTelephone) {
      reservation.reservationFor.telephone = this.restaurantTelephone;
    }
    if (this.bookingTime) reservation.bookingTime = this.bookingTime;
    if (this.url) reservation.url = this.url;

    return reservation;
  }
}
