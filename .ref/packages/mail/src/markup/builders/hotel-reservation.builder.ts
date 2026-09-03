import { ReservationStatus } from '@enums';
import { BaseMarkupBuilder } from './base-markup.builder';
import { ILodgingReservation, IOrganization, IPerson, IPostalAddress } from '@markup/schemas';

/**
 * Hotel/Lodging Reservation Builder
 *
 * Builder class for creating hotel and lodging reservation markup
 *
 * @class HotelReservationBuilder
 * @extends {BaseMarkupBuilder<ILodgingReservation>}
 *
 * @example Hotel booking
 * ```typescript
 * const hotelMarkup = HotelReservationBuilder.make()
 *   .setReservationNumber('HTL-789456')
 *   .setStatus(ReservationStatus.CONFIRMED)
 *   .setGuestName({ '@type': 'Person', name: 'Jane Doe', email: 'jane@example.com' })
 *   .setHotel(
 *     'Grand Plaza Hotel',
 *     {
 *       '@type': 'PostalAddress',
 *       streetAddress: '123 Main Street',
 *       addressLocality: 'Miami',
 *       addressRegion: 'FL',
 *       postalCode: '33101',
 *       addressCountry: 'US',
 *     },
 *     '+1-305-555-1234'
 *   )
 *   .setCheckinTime('2024-03-15T15:00:00Z')
 *   .setCheckoutTime('2024-03-18T11:00:00Z')
 *   .setBookingTime('2024-01-10T14:30:00Z')
 *   .setUrl('https://example.com/bookings/HTL-789456')
 *   .build();
 * ```
 *
 * @example Resort booking
 * ```typescript
 * const resortBooking = HotelReservationBuilder.make()
 *   .setReservationNumber('RST-2024-555')
 *   .setStatus(ReservationStatus.CONFIRMED)
 *   .setGuestName({
 *     '@type': 'Person',
 *     name: 'John Smith',
 *     email: 'john@example.com',
 *   })
 *   .setHotel('Oceanview Resort & Spa', {
 *     '@type': 'PostalAddress',
 *     streetAddress: '456 Beach Boulevard',
 *     addressLocality: 'Malibu',
 *     addressRegion: 'CA',
 *     postalCode: '90265',
 *     addressCountry: 'US',
 *   })
 *   .setCheckinTime('2024-06-01T16:00:00Z')
 *   .setCheckoutTime('2024-06-07T10:00:00Z')
 *   .build();
 * ```
 */
export class HotelReservationBuilder extends BaseMarkupBuilder<ILodgingReservation> {
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
   * Hotel name
   *
   * @private
   */
  private hotelName!: string;

  /**
   * Hotel address
   *
   * @private
   */
  private hotelAddress!: IPostalAddress;

  /**
   * Hotel telephone (optional)
   *
   * @private
   */
  private hotelTelephone?: string;

  /**
   * Check-in time in ISO 8601 format
   *
   * @private
   */
  private checkinTime!: string;

  /**
   * Check-out time in ISO 8601 format
   *
   * @private
   */
  private checkoutTime!: string;

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
   * Sets the hotel details
   *
   * @param name - Hotel name
   * @param address - Hotel address
   * @param telephone - Hotel phone number (optional)
   * @returns This builder instance
   */
  setHotel(name: string, address: IPostalAddress, telephone?: string): this {
    this.hotelName = name;
    this.hotelAddress = address;
    if (telephone) this.hotelTelephone = telephone;
    return this;
  }

  /**
   * Sets the check-in time
   *
   * @param time - Check-in time (ISO 8601 format)
   * @returns This builder instance
   */
  setCheckinTime(time: string): this {
    this.checkinTime = time;
    return this;
  }

  /**
   * Sets the check-out time
   *
   * @param time - Check-out time (ISO 8601 format)
   * @returns This builder instance
   */
  setCheckoutTime(time: string): this {
    this.checkoutTime = time;
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
   * Builds the hotel reservation markup
   *
   * @returns Complete hotel reservation markup object
   * @throws Error if required fields are missing
   */
  build(): ILodgingReservation {
    if (!this.reservationNumber) {
      throw new Error('Reservation number is required');
    }
    if (!this.reservationStatus) {
      throw new Error('Reservation status is required');
    }
    if (!this.underName) {
      throw new Error('Guest name is required');
    }
    if (!this.hotelName || !this.hotelAddress) {
      throw new Error('Hotel name and address are required');
    }
    if (!this.checkinTime) {
      throw new Error('Check-in time is required');
    }
    if (!this.checkoutTime) {
      throw new Error('Check-out time is required');
    }

    const reservation: ILodgingReservation = {
      '@context': this.context,
      '@type': 'LodgingReservation',

      reservationNumber: this.reservationNumber,
      reservationStatus: this.reservationStatus,
      underName: this.underName,

      reservationFor: {
        '@type': 'LodgingBusiness',
        name: this.hotelName,
        address: this.hotelAddress,
      },

      checkinTime: this.checkinTime,
      checkoutTime: this.checkoutTime,
    };

    if (this.hotelTelephone) {
      reservation.reservationFor.telephone = this.hotelTelephone;
    }
    if (this.bookingTime) reservation.bookingTime = this.bookingTime;
    if (this.url) reservation.url = this.url;

    return reservation;
  }
}
