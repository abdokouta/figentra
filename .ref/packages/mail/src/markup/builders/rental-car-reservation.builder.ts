import { ReservationStatus } from '@enums';
import { BaseMarkupBuilder } from './base-markup.builder';
import { IRentalCarReservation, IOrganization, IPerson, IPostalAddress } from '@markup/schemas';

/**
 * Rental Car Reservation Builder
 *
 * Builder class for creating rental car reservation markup
 *
 * @class RentalCarReservationBuilder
 * @extends {BaseMarkupBuilder<IRentalCarReservation>}
 *
 * @example Basic car rental
 * ```typescript
 * const carRentalMarkup = RentalCarReservationBuilder.make()
 *   .setReservationNumber('CAR-789012')
 *   .setStatus(ReservationStatus.CONFIRMED)
 *   .setRenterName({ '@type': 'Person', name: 'Jane Smith', email: 'jane@example.com' })
 *   .setVehicle('Toyota Camry', 'Toyota')
 *   .setPickupLocation(
 *     'Airport Rental Center',
 *     {
 *       '@type': 'PostalAddress',
 *       streetAddress: '1 Airport Road',
 *       addressLocality: 'Los Angeles',
 *       addressRegion: 'CA',
 *       postalCode: '90045',
 *       addressCountry: 'US',
 *     }
 *   )
 *   .setPickupTime('2024-04-01T10:00:00Z')
 *   .setDropoffLocation(
 *     'Downtown Office',
 *     {
 *       '@type': 'PostalAddress',
 *       streetAddress: '123 Main Street',
 *       addressLocality: 'Los Angeles',
 *       addressRegion: 'CA',
 *       postalCode: '90012',
 *       addressCountry: 'US',
 *     }
 *   )
 *   .setDropoffTime('2024-04-05T10:00:00Z')
 *   .setUrl('https://example.com/rentals/CAR-789012')
 *   .build();
 * ```
 *
 * @example Luxury car rental with same return location
 * ```typescript
 * const luxuryRental = RentalCarReservationBuilder.make()
 *   .setReservationNumber('LUX-2024-456')
 *   .setStatus(ReservationStatus.CONFIRMED)
 *   .setRenterName({
 *     '@type': 'Person',
 *     name: 'Robert Jones',
 *     email: 'robert@example.com',
 *   })
 *   .setVehicle('Mercedes-Benz S-Class', 'Mercedes-Benz')
 *   .setPickupLocation('Luxury Car Center', {
 *     '@type': 'PostalAddress',
 *     streetAddress: '500 Premium Boulevard',
 *     addressLocality: 'Miami',
 *     addressRegion: 'FL',
 *     postalCode: '33101',
 *     addressCountry: 'US',
 *   })
 *   .setPickupTime('2024-07-10T09:00:00Z')
 *   .setDropoffTime('2024-07-15T18:00:00Z')
 *   .setBookingTime('2024-06-01T14:30:00Z')
 *   .build();
 * ```
 */
export class RentalCarReservationBuilder extends BaseMarkupBuilder<IRentalCarReservation> {
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
   * Renter name (person or organization)
   *
   * @private
   */
  private underName!: IPerson | IOrganization;

  /**
   * Vehicle model
   *
   * @private
   */
  private vehicleModel!: string;

  /**
   * Vehicle brand name (optional)
   *
   * @private
   */
  private vehicleBrand?: string;

  /**
   * Pickup location name
   *
   * @private
   */
  private pickupLocationName!: string;

  /**
   * Pickup location address
   *
   * @private
   */
  private pickupLocationAddress!: IPostalAddress;

  /**
   * Pickup time in ISO 8601 format
   *
   * @private
   */
  private pickupTime!: string;

  /**
   * Dropoff location name (optional)
   *
   * @private
   */
  private dropoffLocationName?: string;

  /**
   * Dropoff location address (optional)
   *
   * @private
   */
  private dropoffLocationAddress?: IPostalAddress;

  /**
   * Dropoff time in ISO 8601 format (optional)
   *
   * @private
   */
  private dropoffTime?: string;

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
   * Sets the renter name
   *
   * @param name - Renter details
   * @returns This builder instance
   */
  setRenterName(name: IPerson | IOrganization): this {
    this.underName = name;
    return this;
  }

  /**
   * Sets the vehicle details
   *
   * @param model - Vehicle model
   * @param brand - Vehicle brand (optional)
   * @returns This builder instance
   */
  setVehicle(model: string, brand?: string): this {
    this.vehicleModel = model;
    if (brand) this.vehicleBrand = brand;
    return this;
  }

  /**
   * Sets the pickup location details
   *
   * @param name - Location name
   * @param address - Location address
   * @returns This builder instance
   */
  setPickupLocation(name: string, address: IPostalAddress): this {
    this.pickupLocationName = name;
    this.pickupLocationAddress = address;
    return this;
  }

  /**
   * Sets the pickup time
   *
   * @param time - Pickup time (ISO 8601 format)
   * @returns This builder instance
   */
  setPickupTime(time: string): this {
    this.pickupTime = time;
    return this;
  }

  /**
   * Sets the dropoff location details
   *
   * @param name - Location name
   * @param address - Location address
   * @returns This builder instance
   */
  setDropoffLocation(name: string, address: IPostalAddress): this {
    this.dropoffLocationName = name;
    this.dropoffLocationAddress = address;
    return this;
  }

  /**
   * Sets the dropoff time
   *
   * @param time - Dropoff time (ISO 8601 format)
   * @returns This builder instance
   */
  setDropoffTime(time: string): this {
    this.dropoffTime = time;
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
   * Builds the rental car reservation markup
   *
   * @returns Complete rental car reservation markup object
   * @throws Error if required fields are missing
   */
  build(): IRentalCarReservation {
    if (!this.reservationNumber) {
      throw new Error('Reservation number is required');
    }
    if (!this.reservationStatus) {
      throw new Error('Reservation status is required');
    }
    if (!this.underName) {
      throw new Error('Renter name is required');
    }
    if (!this.vehicleModel) {
      throw new Error('Vehicle model is required');
    }
    if (!this.pickupLocationName || !this.pickupLocationAddress) {
      throw new Error('Pickup location name and address are required');
    }
    if (!this.pickupTime) {
      throw new Error('Pickup time is required');
    }

    const reservation: IRentalCarReservation = {
      '@context': this.context,
      '@type': 'RentalCarReservation',

      reservationNumber: this.reservationNumber,
      reservationStatus: this.reservationStatus,
      underName: this.underName,

      reservationFor: {
        '@type': 'RentalCar',
        model: this.vehicleModel,
      },

      pickupLocation: {
        '@type': 'Place',
        name: this.pickupLocationName,
        address: this.pickupLocationAddress,
      },

      pickupTime: this.pickupTime,
    };

    if (this.vehicleBrand) {
      reservation.reservationFor.brand = {
        '@type': 'Brand',
        name: this.vehicleBrand,
      };
    }

    if (this.dropoffLocationName && this.dropoffLocationAddress) {
      reservation.dropoffLocation = {
        '@type': 'Place',
        name: this.dropoffLocationName,
        address: this.dropoffLocationAddress,
      };
    }

    if (this.dropoffTime) reservation.dropoffTime = this.dropoffTime;
    if (this.bookingTime) reservation.bookingTime = this.bookingTime;
    if (this.url) reservation.url = this.url;

    return reservation;
  }
}
