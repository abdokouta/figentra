/**
 * @file hateoas-link.interface.ts
 * @module @stackra/response/src/interfaces
 * @description IHateoasLink interface.
 */

/**
 * HATEOAS link descriptor for hypermedia-driven responses.
 *
 * Represents a navigable link in the API response that clients
 * can follow to discover related resources and actions.
 */
export interface IHateoasLink {
  /** Link relation type (e.g., 'self', 'next', 'collection'). */
  rel: string;
  /** The URL of the linked resource. */
  href: string;
  /** HTTP method to use when following the link. */
  method?: string;
  /** Human-readable title for the link. */
  title?: string;
}
