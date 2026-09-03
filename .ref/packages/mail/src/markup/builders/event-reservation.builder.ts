import { ReservationStatus } from '@enums';
import { BaseMarkupBuilder } from './base-markup.builder';
import { IEventReservation, IOrganization, IPerson, IPostalAddress } from '@markup/schemas';

/**
 * Event Reservation/Ticket Builder
 *
 * Builder class for creating event ticket/reservation markup for concerts,
 * conferences, sports events, theater shows, etc.
 *
 * @class EventReservationBuilder
 * @extends {BaseMarkupBuilder<IEventReservation>}
 *
 * @example Concert ticket
 * ```typescript
 * const ticketMarkup = EventReservationBuilder.make()
 *   .setReservationNumber('TKT-12345')
 *   .setStatus(ReservationStatus.CONFIRMED)
 *   .setUnderName({ '@type': 'Person', name: 'John Doe', email: 'john@example.com' })
 *   .setEventName('Taylor Swift - Eras Tour')
 *   .setEventDate('2024-07-15T19:00:00Z')
 *   .setEventEndDate('2024-07-15T23:00:00Z')
 *   .setVenue('Madison Square Garden', {
 *     '@type': 'PostalAddress',
 *     streetAddress: '4 Pennsylvania Plaza',
 *     addressLocality: 'New York',
 *     addressRegion: 'NY',
 *     postalCode: '10001',
 *     addressCountry: 'US',
 *   })
 *   .setNumSeats(2)
 *   .setUrl('https://example.com/tickets/TKT-12345')
 *   .build();
 * ```
 *
 * @example Conference ticket
 * ```typescript
 * const conferenceTicket = EventReservationBuilder.make()
 *   .setReservationNumber('CONF-2024-789')
 *   .setStatus(ReservationStatus.CONFIRMED)
 *   .setUnderName({ '@type': 'Person', name: 'Jane Smith', email: 'jane@example.com' })
 *   .setEventName('Tech Conference 2024')
 *   .setEventDate('2024-09-20T08:00:00Z')
 *   .setEventEndDate('2024-09-22T18:00:00Z')
 *   .setVenue('Convention Center', {
 *     '@type': 'PostalAddress',
 *     streetAddress: '123 Conference Way',
 *     addressLocality: 'San Francisco',
 *     addressRegion: 'CA',
 *     postalCode: '94102',
 *     addressCountry: 'US',
 *   })
 *   .setBookingTime('2024-01-15T10:30:00Z')
 *   .build();
 * ```
 */
export class EventReservationBuilder extends BaseMarkupBuilder<IEventReservation> {
  /**
   * Reservation/ticket confirmation number
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
   * Ticket holder name (person or organization)
   *
   * @private
   */
  private underName!: IPerson | IOrganization;

  /**
   * Event name/title
   *
   * @private
   */
  private eventName!: string;

  /**
   * Event start date and time (ISO 8601 format)
   *
   * @private
   */
  private startDate!: string;

  /**
   * Event end date and time (ISO 8601 format, optional)
   *
   * @private
   */
  private endDate?: string;

  /**
   * Venue/location name
   *
   * @private
   */
  private venueName!: string;

  /**
   * Venue address
   *
   * @private
   */
  private venueAddress!: IPostalAddress;

  /**
   * Number of seats/tickets (optional)
   *
   * @private
   */
  private numSeats?: number;

  /**
   * Booking timestamp in ISO 8601 format (optional)
   *
   * @private
   */
  private bookingTime?: string;

  /**
   * Ticket/confirmation URL (optional)
   *
   * @private
   */
  private url?: string;

  /**
   * Sets the reservation/ticket number
   *
   * @param number - Reservation/ticket number
   * @returns This builder instance
   */
  setReservationNumber(number: string): this {
    this.reservationNumber = number;
    return this;
  }

  /**
   * Sets the reservation status
   *
   * @param status - Reservation status (CONFIRMED, PENDING, CANCELLED)
   * @returns This builder instance
   */
  setStatus(status: ReservationStatus): this {
    this.reservationStatus = status;
    return this;
  }

  /**
   * Sets the ticket holder name
   *
   * @param name - Ticket holder details (person or organization)
   * @returns This builder instance
   */
  setUnderName(name: IPerson | IOrganization): this {
    this.underName = name;
    return this;
  }

  /**
   * Sets the event name
   *
   * @param name - Event name/title
   * @returns This builder instance
   */
  setEventName(name: string): this {
    this.eventName = name;
    return this;
  }

  /**
   * Sets the event start date and time
   *
   * @param date - Event start date (ISO 8601 format)
   * @returns This builder instance
   */
  setEventDate(date: string): this {
    this.startDate = date;
    return this;
  }

  /**
   * Sets the event end date and time
   *
   * @param date - Event end date (ISO 8601 format)
   * @returns This builder instance
   */
  setEventEndDate(date: string): this {
    this.endDate = date;
    return this;
  }

  /**
   * Sets the venue name and address
   *
   * @param name - Venue name
   * @param address - Venue address
   * @returns This builder instance
   */
  setVenue(name: string, address: IPostalAddress): this {
    this.venueName = name;
    this.venueAddress = address;
    return this;
  }

  /**
   * Sets the number of seats/tickets
   *
   * @param count - Number of seats
   * @returns This builder instance
   */
  setNumSeats(count: number): this {
    this.numSeats = count;
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
   * Sets the ticket/confirmation URL
   *
   * @param url - Ticket URL
   * @returns This builder instance
   */
  setUrl(url: string): this {
    this.url = url;
    return this;
  }

  /**
   * Builds the event reservation markup
   *
   * @returns Complete event reservation markup object
   * @throws Error if required fields are missing
   */
  build(): IEventReservation {
    if (!this.reservationNumber) {
      throw new Error('Reservation number is required');
    }
    if (!this.reservationStatus) {
      throw new Error('Reservation status is required');
    }
    if (!this.underName) {
      throw new Error('Ticket holder name is required');
    }
    if (!this.eventName) {
      throw new Error('Event name is required');
    }
    if (!this.startDate) {
      throw new Error('Event start date is required');
    }
    if (!this.venueName || !this.venueAddress) {
      throw new Error('Venue name and address are required');
    }

    const reservation: IEventReservation = {
      '@context': this.context,
      '@type': 'EventReservation',

      reservationNumber: this.reservationNumber,
      reservationStatus: this.reservationStatus,
      underName: this.underName,

      reservationFor: {
        '@type': 'Event',
        name: this.eventName,
        startDate: this.startDate,
        location: {
          '@type': 'Place',
          name: this.venueName,
          address: this.venueAddress,
        },
      },
    };

    if (this.endDate) reservation.reservationFor.endDate = this.endDate;
    if (this.numSeats) reservation.numSeats = this.numSeats;
    if (this.bookingTime) reservation.bookingTime = this.bookingTime;
    if (this.url) reservation.url = this.url;

    return reservation;
  }
}
