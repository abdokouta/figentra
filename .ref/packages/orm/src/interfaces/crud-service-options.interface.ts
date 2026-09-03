/**
 * @file crud-service-options.interface.ts
 * @description Defines options for configuring a generated CRUD service.
 */

/**
 * Options for creating a CRUD service via the factory.
 */
export interface CrudServiceOptions {
  /** The entity class this service manages. */
  entity: Function;

  /** Optional custom service class to extend instead of the default. */
  customService?: Function;
}
