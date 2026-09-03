import { ReservationStatus } from '@enums';
import { IBaseMarkup, IOrganization, IPostalAddress, IPerson } from './base-markup.schema';

/**
 * Base Reservation Schema
 *
 * Base interface for all reservation types
 *
 * @interface IBaseReservation
 * @extends {IBaseMarkup}
 */
export interface IBaseReservation extends IBaseMarkup {
  /**
   * Reservation number
   */
  reservationNumber: string;

  /**
   * Reservation status
   */
  reservationStatus: ReservationStatus;

  /**
   * Under name
   */
  underName: IPerson | IOrganization;

  /**
   * Reservation for
   */
  reservationFor: any;

  /**
   * Booking time
   */
  bookingTime?: string;

  /**
   * Modified time
   */
  modifiedTime?: string;

  /**
   * Confirmation URL
   */
  url?: string;
}

/**
 * Flight Reservation Schema
 *
 * Represents a flight reservation
 *
 * @interface IFlightReservation
 * @extends {IBaseReservation}
 */
export interface IFlightReservation extends IBaseReservation {
  '@type': 'FlightReservation';

  /**
   * Flight details
   */
  reservationFor: {
    '@type': 'Flight';

    /**
     * Flight number
     */
    flightNumber: string;
    /**
     * Airline
     */
    airline: IOrganization;
    /**
     * Departure airport
     */
    departureAirport: {
      '@type': 'Airport';

      /**
       * Airport name
       */
      name: string;
      /**
       * Airport code
       */
      iataCode: string;
    };
    /**
     * Departure time
     */
    departureTime: string;
    /**
     * Arrival airport
     */
    arrivalAirport: {
      '@type': 'Airport';

      /**
       * Airport name
       */
      name: string;
      /**
       * Airport code
       */
      iataCode: string;
    };
    /**
     * Arrival time
     */
    arrivalTime: string;
  };

  /**
   * Boarding pass
   */
  boardingPass?: {
    '@type': 'BoardingPass';

    /**
     * Barcode
     */
    barcode?: string;
    /**
     * Seat
     */
    boardingGroup?: string;
    /**
     * Seat number
     */
    seatNumber?: string;
  };
}

/**
 * Hotel Reservation Schema
 *
 * Represents a hotel/lodging reservation
 *
 * @interface ILodgingReservation
 * @extends {IBaseReservation}
 */
export interface ILodgingReservation extends IBaseReservation {
  '@type': 'LodgingReservation';

  /**
   * Hotel details
   */
  reservationFor: {
    '@type': 'LodgingBusiness';

    /**
     * Hotel name
     */
    name: string;
    /**
     * Hotel address
     */
    address: IPostalAddress;
    /**
     * Hotel telephone
     */
    telephone?: string;
  };

  /**
   * Check-in time
   */
  checkinTime: string;

  /**
   * Check-out time
   */
  checkoutTime: string;
}

/**
 * Restaurant Reservation Schema
 *
 * Represents a restaurant reservation
 *
 * @interface IFoodEstablishmentReservation
 * @extends {IBaseReservation}
 */
export interface IFoodEstablishmentReservation extends IBaseReservation {
  '@type': 'FoodEstablishmentReservation';

  /**
   * Restaurant details
   */
  reservationFor: {
    '@type': 'FoodEstablishment';

    /**
     * Restaurant name
     */
    name: string;
    /**
     * Restaurant address
     */
    address: IPostalAddress;
    /**
     * Restaurant telephone
     */
    telephone?: string;
  };

  /**
   * Start time
   */
  startTime: string;

  /**
   * Party size
   */
  partySize: number;
}

/**
 * Event Reservation Schema
 *
 * Represents an event reservation
 *
 * @interface IEventReservation
 * @extends {IBaseReservation}
 */
export interface IEventReservation extends IBaseReservation {
  '@type': 'EventReservation';

  /**
   * Event details
   */
  reservationFor: {
    '@type': 'Event';

    /**
     * Event name
     */
    name: string;
    /**
     * Start date
     */
    startDate: string;
    /**
     * End date
     */
    endDate?: string;
    /**
     * Location
     */
    location: {
      '@type': 'Place';

      /**
       * Place name
       */
      name: string;
      /**
       * Place address
       */
      address: IPostalAddress;
    };
  };

  /**
   * Number of seats
   */
  numSeats?: number;
}

/**
 * Rental Car Reservation Schema
 *
 * Represents a rental car reservation
 *
 * @interface IRentalCarReservation
 * @extends {IBaseReservation}
 */
export interface IRentalCarReservation extends IBaseReservation {
  '@type': 'RentalCarReservation';

  /**
   * Rental car details
   */
  reservationFor: {
    '@type': 'RentalCar';

    /**
     * Car model
     */
    model: string;
    /**
     * Car brand
     */
    brand?: {
      '@type': 'Brand';

      /**
       * Brand name
       */
      name: string;
    };
  };

  /**
   * Pickup location
   */
  pickupLocation: {
    '@type': 'Place';

    /**
     * Location name
     */
    name: string;
    /**
     * Location address
     */
    address: IPostalAddress;
  };

  /**
   * Pickup time
   */
  pickupTime: string;

  /**
   * Dropoff location
   */
  dropoffLocation?: {
    '@type': 'Place';

    /**
     * Location name
     */
    name: string;
    /**
     * Location address
     */
    address: IPostalAddress;
  };

  /**
   * Dropoff time
   */
  dropoffTime?: string;
}
