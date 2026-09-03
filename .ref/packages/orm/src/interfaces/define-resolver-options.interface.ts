/**
 * @file define-resolver-options.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description DefineResolverOptions interface.
 */

/**
 * Configuration for the auto-generated CRUD resolver.
 */
export interface DefineResolverOptions {
  /** The entity class (GraphQL ObjectType). */
  entity: IType<any>;
  /** CreateInput DTO class. */
  create: IType<any>;
  /** UpdateInput DTO class. */
  update: IType<any>;
  /** FilterInput class (optional). */
  filter?: IType<any>;
  /** SortInput class (optional). */
  sort?: IType<any>;
  /** Singular name (e.g., 'tenant'). Used in query/mutation names. */
  name: string;
  /** Plural name (defaults to name + 's'). */
  pluralName?: string;
}
