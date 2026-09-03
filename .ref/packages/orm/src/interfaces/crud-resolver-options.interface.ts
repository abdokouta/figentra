/**
 * @file crud-resolver-options.interface.ts
 * @description Defines options for configuring a generated CRUD GraphQL resolver.
 */

/**
 * Options for creating a CRUD resolver via the factory.
 */
export interface CrudResolverOptions {
  /** The entity class this resolver handles. */
  entity: Function;

  /** The service class (or token) to inject for data operations. */
  service: Function;

  /** Optional custom resolver class to extend instead of the default. */
  customResolver?: Function;

  /** Whether to generate query resolvers. Defaults to true. */
  queries?: boolean;

  /** Whether to generate mutation resolvers. Defaults to true. */
  mutations?: boolean;
}
