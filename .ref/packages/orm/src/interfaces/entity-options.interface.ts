/**
 * @file entity-options.interface.ts
 * @description Options passed to the @Entity() decorator.
 */

/**
 * Options for the @Entity() decorator.
 */
export interface EntityOptions {
  /** Database table name. Defaults to lowercase class name + 's'. */
  tableName?: string;
  /** Optional description for GraphQL schema. */
  description?: string;
  /** Database connection name. Defaults to 'default'. */
  connection?: string;
  /** Custom repository class factory. */
  repository?: () => any;
}
