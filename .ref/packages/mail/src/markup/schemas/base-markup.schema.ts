/**
 * Base Markup Schema
 *
 * Base interface for all JSON-LD markup schemas
 *
 * @interface IBaseMarkup
 */
export interface IBaseMarkup {
  /**
   * JSON-LD context
   */
  '@context': string;

  /**
   * Schema.org type
   */
  '@type': string;
}

/**
 * Organization Schema
 *
 * Represents an organization
 *
 * @interface IOrganization
 */
export interface IOrganization {
  '@type': 'Organization';

  /**
   * Organization name
   */
  name: string;

  /**
   * Organization email
   */
  email?: string;

  /**
   * Organization telephone
   */
  telephone?: string;

  /**
   * Organization URL
   */
  url?: string;
}

/**
 * Person Schema
 *
 * Represents a person
 *
 * @interface IPerson
 */
export interface IPerson {
  '@type': 'Person';

  /**
   * Person name
   */
  name: string;

  /**
   * Person email
   */
  email?: string;

  /**
   * Person telephone
   */
  telephone?: string;
}

/**
 * Postal Address Schema
 *
 * Represents a physical address
 *
 * @interface IPostalAddress
 */
export interface IPostalAddress {
  '@type': 'PostalAddress';

  /**
   * Street address
   */
  streetAddress?: string;

  /**
   * Address locality (city)
   */
  addressLocality?: string;

  /**
   * Address region (state)
   */
  addressRegion?: string;

  /**
   * Postal code
   */
  postalCode?: string;

  /**
   * Address country
   */
  addressCountry?: string;
}

/**
 * Price Specification Schema
 *
 * Represents a price
 *
 * @interface IPriceSpecification
 */
export interface IPriceSpecification {
  '@type': 'PriceSpecification';

  /**
   * Price value
   */
  price: string | number;

  /**
   * Price currency (ISO 4217)
   */
  priceCurrency: string;
}
