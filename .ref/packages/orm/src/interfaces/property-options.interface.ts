/**
 * @file property-options.interface.ts
 * @description Options for the @Property() decorator.
 */

/**
 * Options for configuring an entity property.
 */
export interface PropertyOptions {
  /** Database column type. */
  type?:
    | 'uuid'
    | 'string'
    | 'integer'
    | 'decimal'
    | 'boolean'
    | 'datetime'
    | 'json'
    | 'text'
    | 'enum';
  /** Mark as primary key. */
  primary?: boolean;
  /** Mark column as unique. */
  unique?: boolean;
  /** Mark column as nullable. */
  nullable?: boolean;
  /** Default value. */
  default?: any;
  /** Create an index. */
  index?: boolean;
  /** Enum factory (for enum type). */
  enum?: (() => object) | object;
  /** Hook: called on create. */
  onCreate?: () => any;
  /** Hook: called on update. */
  onUpdate?: () => any;
  /** Optimistic lock version field. */
  version?: boolean;
  /** Column length. */
  length?: number;
  /** Decimal precision. */
  precision?: number;
  /** Decimal scale. */
  scale?: number;
}
