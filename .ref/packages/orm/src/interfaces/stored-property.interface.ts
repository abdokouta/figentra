/**
 * @file stored-property.interface.ts
 * @description Internal representation of a property stored in metadata.
 */

import { PropertyOptions } from './property-options.interface';

/**
 * A property definition as stored in class metadata.
 */
export interface StoredProperty {
  /** The property key (field name). */
  key: string;
  /** Property configuration. */
  type?: PropertyOptions['type'];
  primary?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: any;
  defaultValue?: any;
  index?: boolean;
  enum?: (() => object) | object;
  onCreate?: () => any;
  onUpdate?: () => any;
  version?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
}
